"""
Gemini Emotion Classifier
==========================
Uses Google's Gemini model to classify complex emotions in cricket fan messages.

Design decisions:
  - Gemini is the "deep path" — used for Hinglish, slang, irony, and ambiguous text
  - Rule-based classification handles obvious cases (all-caps celebration, simple emoji)
  - Google Cloud NL API is the "fast path" for clean English text
  - Dynamic routing: only ~30% of messages actually need Gemini
"""

import json
import logging
import re
from typing import Optional

from google.cloud import language_v2
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

from schemas import GeminiEmotionResponse

logger = logging.getLogger(__name__)

# ── System Prompt ───────────────────────────────────────────────────────────

GEMINI_SYSTEM_PROMPT = """You are an expert sports psychologist and linguist specializing in Indian cricket fandom.
Analyze the provided fan message and extract the emotional profile.

CRITICAL CONTEXT:
- Text is likely code-mixed "Hinglish" (Hindi+English), heavy in slang and emojis.
- Emojis have been pre-expanded to semantic tags like [excitement/fire] or [emotional_overwhelm].
- "😭" ([emotional_overwhelm]) after a six or great shot = JOY/DISBELIEF, not sadness.
- "[mockery/clown]" directed at a player = OUTRAGE or schadenfreude.
- ALL CAPS = high intensity, not shouting per se.
- Distinguish IRONIC devastation ("bumrah is destroying them 😭" = joy for Bumrah's team fans)
  from GENUINE devastation ("we lost the cup 😭" = actual sadness).
- If the message mentions an umpire, review, or DRS, check for CONTROVERSY signals.

TEAM AFFILIATION:
- If the message clearly supports one team, set team_affiliation to "team_a" or "team_b".
- Set team_a_sentiment and team_b_sentiment independently. A controversial decision can produce
  team_a_sentiment: 0.9 AND team_b_sentiment: -0.8 simultaneously. DO NOT average them.

OUTPUT: Return ONLY valid JSON matching this schema:
{
  "primary": "<joy|euphoria|outrage|anxiety|devastation|disbelief|neutral>",
  "secondary": "<optional secondary emotion or null>",
  "intensity": <0.0 to 1.0>,
  "team_affiliation": "<team_a|team_b|neutral|unknown>",
  "team_a_sentiment": <-1.0 to 1.0 or null>,
  "team_b_sentiment": <-1.0 to 1.0 or null>
}"""

GEMINI_FEW_SHOT_EXAMPLES = [
    {
        "input": "YESSS WHAT A SHOT [excitement/fire][excitement/fire][excitement/fire] Kohli you beauty!!!",
        "output": '{"primary":"euphoria","secondary":"disbelief","intensity":0.95,"team_affiliation":"team_a","team_a_sentiment":0.95,"team_b_sentiment":-0.3}',
    },
    {
        "input": "iske baad toh gaya bhai [emotional_overwhelm]",
        "output": '{"primary":"devastation","secondary":"anxiety","intensity":0.8,"team_affiliation":"team_b","team_a_sentiment":null,"team_b_sentiment":-0.7}',
    },
    {
        "input": "umpire is blind wtf is that call [frustration]",
        "output": '{"primary":"outrage","secondary":"frustration","intensity":0.85,"team_affiliation":"unknown","team_a_sentiment":null,"team_b_sentiment":null}',
    },
    {
        "input": "bumrah destroying them [emotional_overwhelm][emotional_overwhelm] too good",
        "output": '{"primary":"euphoria","secondary":"joy","intensity":0.9,"team_affiliation":"team_a","team_a_sentiment":0.9,"team_b_sentiment":-0.6}',
    },
    {
        "input": "last ball 6 needed [nervous_watching][prayer/hope] cant watch",
        "output": '{"primary":"anxiety","secondary":"disbelief","intensity":0.92,"team_affiliation":"unknown","team_a_sentiment":null,"team_b_sentiment":null}',
    },
]


def _build_few_shot_prompt(text: str) -> str:
    """Build the full prompt with few-shot examples."""
    examples = "\n\n".join(
        f"Input: \"{ex['input']}\"\nOutput: {ex['output']}"
        for ex in GEMINI_FEW_SHOT_EXAMPLES
    )
    return f"EXAMPLES:\n{examples}\n\nNow analyze this message:\nInput: \"{text}\"\nOutput:"


class EmotionClassifier:
    """Routes messages to the optimal classification path."""

    def __init__(self, project_id: str, location: str = "asia-south1"):
        self.project_id = project_id
        self.location = location

        # Initialize Vertex AI / Gemini
        vertexai.init(project=project_id, location=location)
        self.gemini_model = GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=GEMINI_SYSTEM_PROMPT,
            generation_config=GenerationConfig(
                temperature=0.1,  # Low temp for consistent structured output
                max_output_tokens=256,
                response_mime_type="application/json",
            ),
        )

        # Google Cloud NL API client (fast path)
        self.nl_client = language_v2.LanguageServiceClient()

    def classify(self, text: str, language: str) -> GeminiEmotionResponse:
        """
        Route to the best classification method:
          1. Rule-based: obvious patterns (all-caps celebration, emoji-only)
          2. Cloud NL API: clean English text with simple sentiment
          3. Gemini: everything else (Hinglish, slang, irony, complex emotion)
        """
        # Fast path: rule-based for obvious patterns
        rule_result = self._try_rule_based(text)
        if rule_result:
            return rule_result

        # Medium path: Cloud NL API for clean English
        if language == "en" and self._is_clean_english(text):
            try:
                return self._classify_cloud_nl(text)
            except Exception as e:
                logger.warning("Cloud NL failed, falling back to Gemini: %s", e)

        # Deep path: Gemini for everything else
        return self._classify_gemini(text)

    def _try_rule_based(self, text: str) -> Optional[GeminiEmotionResponse]:
        """Handle obvious patterns without API calls."""
        upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        has_exclamation = text.count("!") >= 3

        # All-caps + exclamation + positive signals
        positive_signals = ["yes", "shot", "six", "four", "century", "beauty", "amazing",
                            "[excitement", "[celebration", "[applause", "[approval"]
        negative_signals = ["out", "dropped", "blind", "cheat", "worst", "pathetic",
                            "[anger]", "[frustration]", "[disapproval]"]

        text_lower = text.lower()
        pos_count = sum(1 for s in positive_signals if s in text_lower)
        neg_count = sum(1 for s in negative_signals if s in text_lower)

        if upper_ratio > 0.7 and has_exclamation and pos_count >= 2 and neg_count == 0:
            return GeminiEmotionResponse(
                primary="euphoria",
                secondary="joy",
                intensity=min(0.7 + (upper_ratio * 0.3), 1.0),
                team_affiliation="unknown",
            )

        if neg_count >= 2 and pos_count == 0:
            intensity = min(0.6 + (neg_count * 0.1), 1.0)
            if upper_ratio > 0.5:
                intensity = min(intensity + 0.15, 1.0)
            return GeminiEmotionResponse(
                primary="outrage",
                secondary="frustration",
                intensity=intensity,
                team_affiliation="unknown",
            )

        return None  # Not obvious enough — needs ML

    def _is_clean_english(self, text: str) -> bool:
        """Check if text is clean English without code-mixing or heavy slang."""
        # Contains Devanagari or other Indic script characters
        if re.search(r"[\u0900-\u097F\u0980-\u09FF]", text):
            return False
        # Contains semantic tags from emoji expansion
        if "[" in text and "]" in text:
            return False
        # Heavy slang markers
        slang = {"bhai", "yaar", "bc", "mc", "lol", "lmao", "bruh", "oof", "gaya", "chala"}
        if any(w in text.lower().split() for w in slang):
            return False
        return True

    def _classify_cloud_nl(self, text: str) -> GeminiEmotionResponse:
        """Use Google Cloud NL API for simple English sentiment."""
        document = language_v2.Document(
            content=text,
            type_=language_v2.Document.Type.PLAIN_TEXT,
            language_code="en",
        )

        response = self.nl_client.analyze_sentiment(
            request={"document": document}
        )

        score = response.document_sentiment.score  # -1.0 to 1.0
        magnitude = response.document_sentiment.magnitude  # 0.0 to inf

        # Map NL API output to our emotion schema
        intensity = min(abs(score) * (1 + magnitude * 0.2), 1.0)

        if score > 0.5:
            primary = "joy" if intensity < 0.8 else "euphoria"
        elif score < -0.5:
            primary = "frustration" if intensity < 0.7 else "outrage"
        elif abs(score) < 0.2 and magnitude > 1.5:
            primary = "anxiety"  # Low polarity + high magnitude = mixed emotions
        else:
            primary = "neutral"

        return GeminiEmotionResponse(
            primary=primary,
            intensity=round(intensity, 2),
            team_affiliation="unknown",
        )

    def _classify_gemini(self, text: str) -> GeminiEmotionResponse:
        """Use Gemini for complex emotion classification."""
        prompt = _build_few_shot_prompt(text)

        try:
            response = self.gemini_model.generate_content(prompt)
            result_text = response.text.strip()

            # Parse the JSON response
            parsed = json.loads(result_text)
            return GeminiEmotionResponse(**parsed)

        except json.JSONDecodeError:
            logger.warning("Gemini returned non-JSON: %s", response.text[:200])
            return GeminiEmotionResponse(
                primary="neutral", intensity=0.3, team_affiliation="unknown"
            )
        except Exception as e:
            logger.error("Gemini classification failed: %s", e)
            return GeminiEmotionResponse(
                primary="neutral", intensity=0.3, team_affiliation="unknown"
            )
