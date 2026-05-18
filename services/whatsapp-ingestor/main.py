"""
WhatsApp Business API Webhook Ingestor
======================================
Receives incoming messages via Meta's webhook verification flow and publishes
them to Pub/Sub.

Webhook verification:
  - GET /webhook → responds with hub.challenge for Meta's verification handshake
  - POST /webhook → receives message payloads, publishes to Pub/Sub

Handling 20-message bursts after wickets:
  - Cloud Run concurrency is set to 250 (webhook payloads are tiny)
  - Max instances at 20 → handles 5000 concurrent webhook deliveries
  - Pub/Sub batching absorbs micro-bursts within each instance
  - Meta retries failed deliveries, so even temporary failures are recovered
"""

import json
import logging
import os
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response, Query
from google.cloud import pubsub_v1

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ───────────────────────────────────────────────────────────

VERIFY_TOKEN = os.environ["WHATSAPP_VERIFY_TOKEN"]
PUBSUB_TOPIC = os.environ["PUBSUB_TOPIC"]
GCP_PROJECT = os.environ["GCP_PROJECT"]

app = FastAPI(title="WhatsApp Webhook Ingestor")

# Pub/Sub publisher — created once, shared across requests
batch_settings = pubsub_v1.types.BatchSettings(
    max_messages=100,
    max_bytes=500_000,
    max_latency=0.05,  # 50ms — very low latency for webhook responses
)
publisher = pubsub_v1.PublisherClient(batch_settings=batch_settings)
topic_path = None  # Initialized on startup


@app.on_event("startup")
def startup():
    global topic_path
    topic_name = PUBSUB_TOPIC.split("/")[-1] if "/" in PUBSUB_TOPIC else PUBSUB_TOPIC
    topic_path = publisher.topic_path(GCP_PROJECT, topic_name)
    logger.info("WhatsApp Ingestor started. Publishing to %s", topic_path)


# ── Webhook Verification (GET) ─────────────────────────────────────────────

@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """
    Meta Business API webhook verification.
    Must respond with hub.challenge to complete the handshake.
    """
    if hub_mode == "subscribe" and hub_token == VERIFY_TOKEN:
        logger.info("Webhook verification successful")
        return Response(content=hub_challenge, media_type="text/plain")

    logger.warning("Webhook verification failed: mode=%s", hub_mode)
    return Response(status_code=403)


# ── Message Ingestion (POST) ───────────────────────────────────────────────

@app.post("/webhook")
async def receive_message(request: Request):
    """
    Receive WhatsApp message webhook payload.
    Extracts text messages and publishes to Pub/Sub.
    Responds 200 immediately — processing is fire-and-forget via Pub/Sub.
    """
    try:
        body = await request.json()
    except Exception:
        return Response(status_code=400)

    # Navigate Meta's nested webhook structure
    entries = body.get("entry", [])
    published_count = 0

    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            contacts = value.get("contacts", [])

            # Build a contact lookup for author info
            contact_map = {}
            for c in contacts:
                contact_map[c.get("wa_id", "")] = c.get("profile", {}).get("name", "")

            for msg in messages:
                # Only process text messages (skip images, stickers, etc. for now)
                if msg.get("type") != "text":
                    continue

                payload = {
                    "id": msg.get("id", ""),
                    "from": msg.get("from", ""),
                    "author_name": contact_map.get(msg.get("from", ""), ""),
                    "text": msg.get("text", {}).get("body", ""),
                    "timestamp": msg.get("timestamp", ""),
                    "type": "text",
                }

                publisher.publish(
                    topic_path,
                    data=json.dumps(payload).encode("utf-8"),
                    source="whatsapp",
                    wa_id=msg.get("from", ""),
                    ingested_at=datetime.now(timezone.utc).isoformat(),
                )
                published_count += 1

    if published_count:
        logger.info("Published %d WhatsApp messages", published_count)

    # Always return 200 quickly — Meta expects fast responses
    return Response(status_code=200)


# ── Health Check ────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "whatsapp-ingestor"}
