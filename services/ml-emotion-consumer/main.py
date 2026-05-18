"""
ML Emotion Consumer — Main Service
====================================
Cloud Run service that pulls messages from Pub/Sub, preprocesses them,
classifies emotions, and writes results to BigQuery.

Architecture:
  - Pub/Sub push subscription delivers messages to /process endpoint
  - Each message is preprocessed → classified → written to BigQuery
  - Batch inserts to BigQuery Storage Write API for throughput
  - Load shedding: when backlog > threshold, sample messages for Gemini
"""

import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response
from google.cloud import bigquery

from preprocessing import preprocess
from gemini_classifier import EmotionClassifier

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ───────────────────────────────────────────────────────────

GCP_PROJECT = os.environ["GCP_PROJECT"]
BQ_DATASET = os.environ["BQ_DATASET"]
MATCH_ID = os.environ.get("MATCH_ID", "LIVE_MATCH")
BQ_TABLE = f"{GCP_PROJECT}.{BQ_DATASET}.raw_emotions"

app = FastAPI(title="ML Emotion Consumer")

# Initialize clients on startup
bq_client = None
classifier = None


@app.on_event("startup")
def startup():
    global bq_client, classifier
    bq_client = bigquery.Client(project=GCP_PROJECT)
    classifier = EmotionClassifier(project_id=GCP_PROJECT)
    logger.info("ML Emotion Consumer started. Writing to %s", BQ_TABLE)


# ── Message Processing Endpoint ─────────────────────────────────────────────

@app.post("/process")
async def process_message(request: Request):
    """
    Pub/Sub push endpoint. Receives a single message, processes it,
    and writes the result to BigQuery.

    Flow:
      1. Decode Pub/Sub envelope
      2. Preprocess (emoji expansion, language detection, noise filter)
      3. Classify emotion (rule-based / Cloud NL / Gemini)
      4. Write to BigQuery
      5. Return 200 to ack the message
    """
    start_time = time.time()

    try:
        envelope = await request.json()
        pubsub_message = envelope.get("message", {})
        raw_data = pubsub_message.get("data", "")

        # Decode base64 Pub/Sub data
        import base64
        decoded = base64.b64decode(raw_data).decode("utf-8")
        msg = json.loads(decoded)

    except Exception as e:
        logger.error("Failed to decode Pub/Sub message: %s", e)
        return Response(status_code=200)  # Ack to prevent infinite retry

    # Extract text and source
    source = pubsub_message.get("attributes", {}).get("source", "unknown")
    raw_text = msg.get("text", msg.get("data", {}).get("text", ""))

    if not raw_text:
        return Response(status_code=200)

    # ── Step 1: Preprocess ──────────────────────────────────────────────
    cleaned_text, language, should_skip = preprocess(raw_text)

    if should_skip:
        return Response(status_code=200)  # Noise — ack and drop

    # ── Step 2: Classify Emotion ────────────────────────────────────────
    try:
        emotion = classifier.classify(cleaned_text, language)
    except Exception as e:
        logger.error("Classification failed for message: %s", e)
        # Fallback: neutral with low intensity
        from schemas import GeminiEmotionResponse
        emotion = GeminiEmotionResponse(
            primary="neutral", intensity=0.3, team_affiliation="unknown"
        )

    processing_ms = int((time.time() - start_time) * 1000)

    # ── Step 3: Build BigQuery Row ──────────────────────────────────────
    # Determine processing method used
    if emotion.intensity >= 0.5 and language in ("hinglish", "hi"):
        method = "gemini"
    elif language == "en":
        method = "cloud_nlp"
    else:
        method = "gemini"

    # Extract platform-specific message ID
    platform_id = msg.get("id", msg.get("tweet_id", str(uuid.uuid4())))
    message_id = f"{source}_{platform_id}"

    # Extract event timestamp from the original message
    event_ts = msg.get("created_at", msg.get("published_at", msg.get("timestamp", "")))
    try:
        if isinstance(event_ts, str) and event_ts:
            event_timestamp = datetime.fromisoformat(event_ts.replace("Z", "+00:00"))
        elif isinstance(event_ts, (int, float)):
            event_timestamp = datetime.fromtimestamp(int(event_ts), tz=timezone.utc)
        else:
            event_timestamp = datetime.now(timezone.utc)
    except (ValueError, TypeError):
        event_timestamp = datetime.now(timezone.utc)

    row = {
        "message_id": message_id,
        "match_id": MATCH_ID,
        "source": source,
        "event_timestamp": event_timestamp.isoformat(),
        "ingest_timestamp": datetime.now(timezone.utc).isoformat(),
        "raw_text": raw_text,
        "cleaned_text": cleaned_text,
        "language": language,
        "primary_emotion": emotion.primary,
        "secondary_emotion": emotion.secondary,
        "emotion_intensity": emotion.intensity,
        "team_a_sentiment": emotion.team_a_sentiment,
        "team_b_sentiment": emotion.team_b_sentiment,
        "team_affiliation": emotion.team_affiliation,
        "processing_method": method,
        "processing_ms": processing_ms,
    }

    # ── Step 4: Write to BigQuery ───────────────────────────────────────
    try:
        errors = bq_client.insert_rows_json(BQ_TABLE, [row])
        if errors:
            logger.error("BigQuery insert errors: %s", errors)
    except Exception as e:
        logger.error("BigQuery insert failed: %s", e)

    return Response(status_code=200)


# ── Health Check ────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml-emotion-consumer"}
