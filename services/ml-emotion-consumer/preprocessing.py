"""
Preprocessing Layer
===================
Transforms raw social media text into a form the ML models can reason about.

Key transformations:
  1. Emoji → semantic meaning (🔥 = excitement, not fire)
  2. Language detection + Hinglish identification
  3. Noise filtering — drop messages with zero emotional signal
  4. Text normalization (lowercase, excess whitespace, URL removal)
"""

import re
import logging
from typing import Optional, Tuple

import emoji
from langdetect import detect, LangDetectException

logger = logging.getLogger(__name__)

# ── Emoji Semantic Mapping ──────────────────────────────────────────────────
# Context: in cricket fan discussions, emojis carry specific emotional weight
# that differs from their literal meaning.

CRICKET_EMOJI_MAP = {
    "🔥": "[excitement/fire]",
    "😭": "[emotional_overwhelm]",  # NOT sadness — often joy/disbelief
    "💪": "[strength/confidence]",
    "🎉": "[celebration]",
    "😱": "[shock]",
    "🤦": "[frustration/facepalm]",
    "❤️": "[love/support]",
    "🏏": "[cricket]",
    "👏": "[applause]",
    "😡": "[anger]",
    "🤣": "[laughter]",
    "😤": "[frustration]",
    "🙏": "[prayer/hope]",
    "💔": "[heartbreak]",
    "🎯": "[precision/accuracy]",
    "🏆": "[championship/victory]",
    "⭐": "[star/excellence]",
    "👎": "[disapproval]",
    "👍": "[approval]",
    "🤡": "[mockery/clown]",
    "💀": "[dead/disbelief]",
    "😂": "[laughter]",
    "🥳": "[celebration]",
    "😑": "[unamused]",
    "🫡": "[salute/respect]",
    "🥲": "[bittersweet_joy]",
    "🫣": "[nervous_watching]",
    "😮‍💨": "[relief]",
}

# ── Noise Patterns ──────────────────────────────────────────────────────────
# Messages matching these patterns carry zero emotional signal.

NOISE_PATTERNS = [
    re.compile(r"^(hi|hello|hey|hii+|namaste)\s*$", re.IGNORECASE),
    re.compile(r"^[\W\d\s]{0,3}$"),  # Only punctuation/numbers/whitespace
    re.compile(r"^(subscribe|like|share|follow)\b", re.IGNORECASE),
    re.compile(r"https?://\S+\s*$"),  # URL-only messages
    re.compile(r"^(.)\1{4,}$"),  # Repeated single character: "aaaaaaa"
    re.compile(r"^#\w+\s*$"),  # Hashtag-only messages
]

# URLs and mentions to strip
URL_PATTERN = re.compile(r"https?://\S+")
MENTION_PATTERN = re.compile(r"@\w+")


def expand_emojis(text: str) -> str:
    """Replace emojis with their cricket-context semantic meaning."""
    result = text
    for emoji_char, meaning in CRICKET_EMOJI_MAP.items():
        result = result.replace(emoji_char, f" {meaning} ")

    # For any remaining emojis not in our map, use the Unicode name
    result = emoji.demojize(result, delimiters=(" [", "] "))
    return result


def detect_language(text: str) -> str:
    """
    Detect language with special handling for Hinglish (Hindi-English code-mixing).
    Hinglish detection: if langdetect says 'hi' but there are significant English words,
    or vice versa, classify as 'hinglish'.
    """
    # Strip emojis and special chars for better detection
    clean = emoji.replace_emoji(text, replace="")
    clean = re.sub(r"[^\w\s]", "", clean).strip()

    if not clean or len(clean) < 3:
        return "unknown"

    try:
        detected = detect(clean)
    except LangDetectException:
        return "unknown"

    # Hinglish heuristic: Hindi detected but contains common English words
    english_markers = {"the", "is", "are", "was", "what", "how", "why", "not", "but",
                       "this", "that", "out", "hit", "shot", "ball", "run", "win", "lost"}
    words = set(clean.lower().split())

    if detected == "hi" and len(words & english_markers) >= 2:
        return "hinglish"
    if detected == "en" and any(ord(c) > 0x0900 and ord(c) < 0x097F for c in clean):
        return "hinglish"

    return detected


def is_noise(text: str) -> bool:
    """Check if a message carries zero emotional signal and should be dropped."""
    stripped = text.strip()

    if len(stripped) < 2:
        return True

    for pattern in NOISE_PATTERNS:
        if pattern.match(stripped):
            return True

    return False


def clean_text(text: str) -> str:
    """Normalize text while preserving emotional content."""
    # Remove URLs
    text = URL_PATTERN.sub("", text)
    # Remove @mentions
    text = MENTION_PATTERN.sub("", text)
    # Collapse excessive whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def preprocess(raw_text: str) -> Tuple[Optional[str], str, bool]:
    """
    Full preprocessing pipeline.

    Returns:
        (cleaned_text, language, should_skip)
        - cleaned_text: preprocessed text ready for ML, or None if noise
        - language: detected language code
        - should_skip: True if this message should be dropped
    """
    if is_noise(raw_text):
        return None, "unknown", True

    language = detect_language(raw_text)
    cleaned = clean_text(raw_text)
    cleaned = expand_emojis(cleaned)

    # After cleaning, check if anything meaningful remains
    stripped = re.sub(r"\[.*?\]", "", cleaned).strip()
    if len(stripped) < 2:
        return None, language, True

    return cleaned, language, False
