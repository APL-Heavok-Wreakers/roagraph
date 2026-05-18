"""
YouTube Live Chat Ingestor
==========================
Polls the YouTube Live Chat API for messages from configured live streams.

Why polling (not push)?
  YouTube Data API v3 does NOT support webhooks/push for live chat.
  Polling is the only option. We dynamically adjust poll frequency based on
  volume: high activity → poll every 2s, low activity → poll every 6s.
  The API returns `pollingIntervalMillis` which we respect as a floor.

Handling 200 → 200,000 viewers (six hit):
  - The API itself throttles via pollingIntervalMillis
  - Our dynamic interval adjusts down during high activity
  - Multiple liveChatIds are polled concurrently via asyncio
  - Pub/Sub absorbs any burst — we never drop messages we've already fetched
"""

import json
import logging
import os
import time
import threading
from datetime import datetime, timezone

from google.cloud import pubsub_v1
from googleapiclient.discovery import build

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ───────────────────────────────────────────────────────────

YOUTUBE_API_KEY = os.environ["YOUTUBE_API_KEY"]
PUBSUB_TOPIC = os.environ["PUBSUB_TOPIC"]
GCP_PROJECT = os.environ["GCP_PROJECT"]

# Channel IDs or Video IDs to monitor — configured per match
MONITORED_CHANNELS = os.environ.get("MONITORED_CHANNELS", "").split(",")
MONITORED_VIDEO_IDS = os.environ.get("MONITORED_VIDEO_IDS", "").split(",")

# ── YouTube API Client ──────────────────────────────────────────────────────


def get_youtube_client():
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)


def resolve_live_chat_ids(youtube):
    """
    Resolve liveChatId for all currently active live streams.
    Handles multiple concurrent streams (e.g., Hindi + English commentary).
    """
    chat_ids = []

    # From explicit video IDs
    for vid in MONITORED_VIDEO_IDS:
        vid = vid.strip()
        if not vid:
            continue
        try:
            resp = youtube.videos().list(
                part="liveStreamingDetails", id=vid
            ).execute()
            for item in resp.get("items", []):
                chat_id = item.get("liveStreamingDetails", {}).get("activeLiveChatId")
                if chat_id:
                    chat_ids.append({"chat_id": chat_id, "video_id": vid})
                    logger.info("Resolved liveChatId for video %s: %s", vid, chat_id)
        except Exception as e:
            logger.error("Failed to resolve video %s: %s", vid, e)

    # From channel search — find active live broadcasts
    for channel_id in MONITORED_CHANNELS:
        channel_id = channel_id.strip()
        if not channel_id:
            continue
        try:
            resp = youtube.search().list(
                part="id",
                channelId=channel_id,
                eventType="live",
                type="video",
                maxResults=5,
            ).execute()

            video_ids = [item["id"]["videoId"] for item in resp.get("items", [])]
            for vid in video_ids:
                detail = youtube.videos().list(
                    part="liveStreamingDetails", id=vid
                ).execute()
                for item in detail.get("items", []):
                    chat_id = item.get("liveStreamingDetails", {}).get("activeLiveChatId")
                    if chat_id:
                        chat_ids.append({"chat_id": chat_id, "video_id": vid})
                        logger.info("Resolved liveChatId for channel %s video %s", channel_id, vid)
        except Exception as e:
            logger.error("Failed to search channel %s: %s", channel_id, e)

    return chat_ids


def create_publisher():
    batch_settings = pubsub_v1.types.BatchSettings(
        max_messages=200,
        max_bytes=1_000_000,
        max_latency=0.1,
    )
    return pubsub_v1.PublisherClient(batch_settings=batch_settings)


def poll_live_chat(youtube, publisher, topic_path, chat_info):
    """
    Poll a single liveChatId continuously.
    Runs in its own thread — one per live stream.
    """
    chat_id = chat_info["chat_id"]
    video_id = chat_info["video_id"]
    page_token = None
    poll_interval = 4.0  # Start conservative

    logger.info("Starting poll loop for chat %s (video %s)", chat_id, video_id)

    while True:
        try:
            request_params = {
                "liveChatId": chat_id,
                "part": "snippet,authorDetails",
                "maxResults": 2000,
            }
            if page_token:
                request_params["pageToken"] = page_token

            resp = youtube.liveChatMessages().list(**request_params).execute()

            messages = resp.get("items", [])
            page_token = resp.get("nextPageToken")

            # Respect YouTube's recommended polling interval
            api_interval = resp.get("pollingIntervalMillis", 4000) / 1000.0

            # Dynamic adjustment: more messages → poll faster (floor = API interval)
            if len(messages) > 100:
                poll_interval = max(api_interval, 2.0)
            elif len(messages) > 20:
                poll_interval = max(api_interval, 4.0)
            else:
                poll_interval = max(api_interval, 6.0)

            # Publish each message
            for msg in messages:
                snippet = msg.get("snippet", {})
                author = msg.get("authorDetails", {})

                payload = {
                    "id": msg["id"],
                    "video_id": video_id,
                    "text": snippet.get("displayMessage", ""),
                    "author_name": author.get("displayName", ""),
                    "author_channel_id": author.get("channelId", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "type": snippet.get("type", "textMessageEvent"),
                }

                publisher.publish(
                    topic_path,
                    data=json.dumps(payload).encode("utf-8"),
                    source="youtube",
                    video_id=video_id,
                    ingested_at=datetime.now(timezone.utc).isoformat(),
                )

            if messages:
                logger.info(
                    "Chat %s: published %d messages, next poll in %.1fs",
                    chat_id[:8], len(messages), poll_interval,
                )

        except Exception as e:
            logger.error("Error polling chat %s: %s", chat_id[:8], e)
            poll_interval = min(poll_interval * 2, 30)  # Back off on errors

        time.sleep(poll_interval)


def main():
    logger.info("Starting YouTube Live Chat Ingestor")

    youtube = get_youtube_client()
    publisher = create_publisher()
    topic_path = publisher.topic_path(GCP_PROJECT, PUBSUB_TOPIC.split("/")[-1])

    # Resolve all active live chat IDs
    chat_list = resolve_live_chat_ids(youtube)

    if not chat_list:
        logger.warning("No active live chats found. Retrying in 30s...")
        time.sleep(30)
        main()
        return

    logger.info("Found %d active live chats", len(chat_list))

    # Start a polling thread per live chat
    threads = []
    for chat_info in chat_list:
        t = threading.Thread(
            target=poll_live_chat,
            args=(youtube, publisher, topic_path, chat_info),
            daemon=True,
        )
        t.start()
        threads.append(t)

    # Keep main thread alive
    for t in threads:
        t.join()


if __name__ == "__main__":
    main()
