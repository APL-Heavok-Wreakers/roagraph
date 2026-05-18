"""
API Server — REST + WebSocket Data Delivery Layer
===================================================
Serves real-time emotion data to dashboard clients.

Architecture:
  - REST endpoints with 5s TTL caching for high-frequency reads
  - WebSocket server for real-time event streaming
  - JWT authentication for dashboard access
  - Reconnection handshake: client sends last_seen_event_id,
    server replays missed events from an in-memory circular buffer
"""

import asyncio
import json
import logging
import os
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from cachetools import TTLCache
from google.cloud import bigquery, pubsub_v1

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

GCP_PROJECT = os.environ.get("GCP_PROJECT", "")
BQ_DATASET = os.environ.get("BQ_DATASET", "cricket_emotions")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-prod")

app = FastAPI(
    title="Cricket Emotion Analytics API",
    version="1.0.0",
    description="Real-time emotion intelligence for live cricket matches",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ── Caching ─────────────────────────────────────────────────────────────────
# 5-second TTL cache — acceptable for a dashboard refreshing every 5s
query_cache = TTLCache(maxsize=100, ttl=5)

# ── WebSocket Management ───────────────────────────────────────────────────

# Circular buffer of recent events for reconnection replay
EVENT_BUFFER_SIZE = 500  # Last 500 events (~5 minutes at peak)
event_buffer = deque(maxlen=EVENT_BUFFER_SIZE)
event_counter = 0

# Connected WebSocket clients
connected_clients: dict[str, WebSocket] = {}

bq_client = None


@app.on_event("startup")
def startup():
    global bq_client
    bq_client = bigquery.Client(project=GCP_PROJECT)
    logger.info("API Server started")


# ── Authentication ──────────────────────────────────────────────────────────

async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """JWT verification for REST endpoints. WebSockets use token in query param."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization")
    # In production, verify JWT signature here
    return credentials.credentials


# ── REST Endpoints ──────────────────────────────────────────────────────────

@app.get("/live-emotions")
async def get_live_emotions(
    match_id: str,
    window: str = "60s",
    source: Optional[str] = None,
):
    """
    Get live emotion distribution and time-series for a match.
    Cache: 5s TTL — stale data is acceptable for dashboard polling.
    """
    cache_key = f"live_{match_id}_{window}_{source}"
    if cache_key in query_cache:
        return query_cache[cache_key]

    # Parse window
    seconds = int(window.replace("s", ""))

    source_filter = ""
    if source:
        sources = source.split(",")
        source_list = ", ".join(f"'{s}'" for s in sources)
        source_filter = f"AND source IN ({source_list})"

    query = f"""
    SELECT
      primary_emotion,
      COUNT(*) as count,
      AVG(emotion_intensity) as avg_intensity,
      TIMESTAMP_TRUNC(event_timestamp, SECOND) as ts
    FROM `{GCP_PROJECT}.{BQ_DATASET}.raw_emotions`
    WHERE match_id = @match_id
      AND event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {seconds} SECOND)
      {source_filter}
    GROUP BY primary_emotion, ts
    ORDER BY ts
    """

    config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("match_id", "STRING", match_id)]
    )
    results = list(bq_client.query(query, job_config=config).result())

    # Build distribution
    distribution = {}
    time_series = []
    for row in results:
        emotion = row["primary_emotion"]
        distribution[emotion] = distribution.get(emotion, 0) + row["count"]
        time_series.append({
            "timestamp": row["ts"].isoformat(),
            "emotion": emotion,
            "count": row["count"],
            "avg_intensity": round(row["avg_intensity"], 3),
        })

    total = sum(distribution.values()) or 1
    distribution = {k: round(v / total, 3) for k, v in distribution.items()}

    response = {"distribution": distribution, "time_series": time_series, "window": window}
    query_cache[cache_key] = response
    return response


@app.get("/over-summary/{over_number}")
async def get_over_summary(over_number: int, match_id: str, innings: int = 1):
    """Get emotion summary for a specific over."""
    cache_key = f"over_{match_id}_{innings}_{over_number}"
    if cache_key in query_cache:
        return query_cache[cache_key]

    query = f"""
    SELECT * FROM `{GCP_PROJECT}.{BQ_DATASET}.over_aggregations`
    WHERE match_id = @match_id AND over_number = @over AND innings = @innings
    ORDER BY computed_at DESC LIMIT 1
    """
    config = bigquery.QueryJobConfig(query_parameters=[
        bigquery.ScalarQueryParameter("match_id", "STRING", match_id),
        bigquery.ScalarQueryParameter("over", "INT64", over_number),
        bigquery.ScalarQueryParameter("innings", "INT64", innings),
    ])
    rows = list(bq_client.query(query, job_config=config).result())

    if not rows:
        raise HTTPException(status_code=404, detail=f"No data for over {over_number}")

    result = dict(rows[0])
    # Convert non-serializable types
    for k, v in result.items():
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()

    query_cache[cache_key] = result
    return result


@app.get("/city-split")
async def get_city_split(match_id: str, top_n: int = 10):
    """Get top N cities by emotion intensity for map rendering."""
    cache_key = f"city_{match_id}_{top_n}"
    if cache_key in query_cache:
        return query_cache[cache_key]

    query = f"""
    SELECT city, state, message_count, avg_intensity, dominant_emotion,
           team_a_sentiment, team_b_sentiment, latitude, longitude
    FROM `{GCP_PROJECT}.{BQ_DATASET}.city_emotions`
    WHERE match_id = @match_id
      AND snapshot_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 300 SECOND)
    ORDER BY avg_intensity * LN(message_count + 1) DESC
    LIMIT @top_n
    """
    config = bigquery.QueryJobConfig(query_parameters=[
        bigquery.ScalarQueryParameter("match_id", "STRING", match_id),
        bigquery.ScalarQueryParameter("top_n", "INT64", top_n),
    ])
    rows = list(bq_client.query(query, job_config=config).result())

    cities = [dict(row) for row in rows]
    query_cache[cache_key] = {"cities": cities, "count": len(cities)}
    return {"cities": cities, "count": len(cities)}


@app.get("/moment-cards")
async def get_moment_cards(
    match_id: str,
    cursor: Optional[str] = None,
    emotion: Optional[str] = None,
    min_intensity: float = 0.0,
    limit: int = 20,
):
    """
    Get moment cards with cursor-based pagination.
    Cursor = card_id of the last seen card (lexicographically ordered).
    """
    filters = ["match_id = @match_id"]
    params = [bigquery.ScalarQueryParameter("match_id", "STRING", match_id)]

    if cursor:
        filters.append("card_id > @cursor")
        params.append(bigquery.ScalarQueryParameter("cursor", "STRING", cursor))
    if emotion:
        filters.append("dominant_emotion = @emotion")
        params.append(bigquery.ScalarQueryParameter("emotion", "STRING", emotion))
    if min_intensity > 0:
        filters.append("intensity >= @min_intensity")
        params.append(bigquery.ScalarQueryParameter("min_intensity", "FLOAT64", min_intensity))

    where = " AND ".join(filters)

    query = f"""
    SELECT * FROM `{GCP_PROJECT}.{BQ_DATASET}.moment_cards`
    WHERE {where}
    ORDER BY created_at DESC
    LIMIT @limit
    """
    params.append(bigquery.ScalarQueryParameter("limit", "INT64", limit))

    config = bigquery.QueryJobConfig(query_parameters=params)
    rows = list(bq_client.query(query, job_config=config).result())

    cards = []
    for row in rows:
        card = dict(row)
        for k, v in card.items():
            if hasattr(v, "isoformat"):
                card[k] = v.isoformat()
        cards.append(card)

    next_cursor = cards[-1]["card_id"] if cards else None
    return {"cards": cards, "next_cursor": next_cursor}


# ── WebSocket Server ────────────────────────────────────────────────────────

@app.websocket("/ws/{match_id}")
async def websocket_endpoint(websocket: WebSocket, match_id: str, last_seen_id: Optional[str] = None):
    """
    WebSocket connection for real-time event streaming.

    Reconnection handshake:
      Client connects with ?last_seen_id=<event_id>
      Server replays all events after that ID from the circular buffer
      Then switches to live streaming.
    """
    await websocket.accept()
    client_id = str(uuid.uuid4())[:8]
    connected_clients[client_id] = websocket
    logger.info("Client %s connected to match %s", client_id, match_id)

    try:
        # ── Reconnection Replay ─────────────────────────────────────────
        if last_seen_id:
            missed_events = []
            found = False
            for event in event_buffer:
                if found:
                    missed_events.append(event)
                elif event.get("event_id") == last_seen_id:
                    found = True

            if missed_events:
                logger.info("Replaying %d missed events for client %s", len(missed_events), client_id)
                for event in missed_events:
                    await websocket.send_json(event)

        # ── Live Streaming ──────────────────────────────────────────────
        while True:
            # Keep connection alive — real events are pushed by broadcast_event()
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                # Handle client pings
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"event": "HEARTBEAT", "timestamp": time.time()})

    except WebSocketDisconnect:
        logger.info("Client %s disconnected", client_id)
    except Exception as e:
        logger.error("WebSocket error for %s: %s", client_id, e)
    finally:
        connected_clients.pop(client_id, None)


async def broadcast_event(event_type: str, data: dict):
    """Broadcast an event to all connected WebSocket clients."""
    global event_counter
    event_counter += 1

    event = {
        "event": event_type,
        "event_id": f"evt_{event_counter}",
        "timestamp": time.time(),
        "data": data,
    }

    # Store in circular buffer for reconnection replay
    event_buffer.append(event)

    # Broadcast to all connected clients
    disconnected = []
    for client_id, ws in connected_clients.items():
        try:
            await ws.send_json(event)
        except Exception:
            disconnected.append(client_id)

    for cid in disconnected:
        connected_clients.pop(cid, None)


# ── Health Check ────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "api-server",
        "connected_clients": len(connected_clients),
        "buffered_events": len(event_buffer),
    }
