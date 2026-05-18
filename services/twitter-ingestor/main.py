  """
Twitter/X Filtered Stream v2 Ingestor
=====================================
Maintains a persistent SSE connection to the Twitter Filtered Stream v2 endpoint.
Publishes each matching tweet as a Pub/Sub message to `raw-twitter`.

Rate-limit handling:
  - On 429, backs off exponentially (1s → 2s → 4s → ... max 300s)
  - On disconnect, reconnects immediately with a linear backoff
  - Pub/Sub acts as the shock absorber: if this service goes down for 60s,
    no messages are lost — they simply weren't captured from Twitter.
    But the pipeline downstream stays healthy.
"""

import json
import logging
import os
import time
from datetime import datetime, timezone

import requests
from google.cloud import pubsub_v1

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ───────────────────────────────────────────────────────────

BEARER_TOKEN = os.environ["TWITTER_BEARER_TOKEN"]
PUBSUB_TOPIC = os.environ["PUBSUB_TOPIC"]
GCP_PROJECT = os.environ["GCP_PROJECT"]

STREAM_URL = "https://api.twitter.com/2/tweets/search/stream"
RULES_URL = "https://api.twitter.com/2/tweets/search/stream/rules"

# Fields we request from Twitter to enrich each tweet
TWEET_FIELDS = "created_at,author_id,lang,geo,public_metrics"
EXPANSIONS = "author_id,geo.place_id"
PLACE_FIELDS = "country,full_name"

# ── Filtered Stream Rules ──────────────────────────────────────────────────
# These rules capture cricket emotion while filtering noise.
# Key design decisions:
#   - Require at least one cricket keyword AND one emotional signal
#   - Exclude retweets (RT) to avoid double-counting
#   - Filter out promotional/bot-like patterns

STREAM_RULES = [
    {
        "value": (
            "(cricket OR #Cricket OR IPL OR #IPL OR T20WorldCup OR #CWC OR #INDvPAK) "
            "(six OR wicket OR century OR boundary OR out OR catch OR dropped OR umpire OR howzat OR shot) "
            "-is:retweet -is:reply "
            "lang:en OR lang:hi"
        ),
        "tag": "cricket-emotion-en-hi",
    },
    {
        "value": (
            "(#INDvPAK OR #INDvsAUS OR #IPL2026 OR #CricketWorldCup) "
            "has:media OR has:images "
            "-is:retweet"
        ),
        "tag": "cricket-visual-reactions",
    },
]


def get_headers():
    return {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "User-Agent": "CricketEmotionPlatform/1.0",
    }


def setup_rules():
    """Replace all existing stream rules with our cricket-specific rules."""
    # Get current rules
    resp = requests.get(RULES_URL, headers=get_headers())
    resp.raise_for_status()
    current = resp.json()

    # Delete existing rules if any
    if current.get("data"):
        ids = [r["id"] for r in current["data"]]
        requests.post(
            RULES_URL,
            headers=get_headers(),
            json={"delete": {"ids": ids}},
        ).raise_for_status()
        logger.info("Deleted %d existing rules", len(ids))

    # Add our rules
    resp = requests.post(
        RULES_URL,
        headers=get_headers(),
        json={"add": STREAM_RULES},
    )
    resp.raise_for_status()
    logger.info("Installed %d stream rules", len(STREAM_RULES))


def create_publisher():
    """Create a Pub/Sub publisher client with batching optimized for throughput."""
    batch_settings = pubsub_v1.types.BatchSettings(
        max_messages=100,
        max_bytes=1_000_000,  # 1 MB
        max_latency=0.1,  # 100ms — low latency for real-time
    )
    return pubsub_v1.PublisherClient(batch_settings=batch_settings)


def publish_tweet(publisher, topic_path, tweet_data):
    """Publish a single tweet to Pub/Sub with metadata attributes."""
    message = json.dumps(tweet_data).encode("utf-8")

    future = publisher.publish(
        topic_path,
        data=message,
        source="twitter",
        tweet_id=str(tweet_data.get("id", "")),
        lang=tweet_data.get("lang", "unknown"),
        ingested_at=datetime.now(timezone.utc).isoformat(),
    )
    return future


def connect_to_stream(publisher, topic_path):
    """
    Connect to the Twitter Filtered Stream and process tweets.

    Backoff strategy:
      - Network error: linear backoff (250ms increments, max 16s)
      - HTTP 429 (rate limit): exponential backoff (1s, 2s, 4s, ..., max 300s)
    """
    network_backoff = 0.25
    rate_limit_backoff = 1.0

    while True:
        try:
            params = {
                "tweet.fields": TWEET_FIELDS,
                "expansions": EXPANSIONS,
                "place.fields": PLACE_FIELDS,
            }

            with requests.get(
                STREAM_URL,
                headers=get_headers(),
                params=params,
                stream=True,
                timeout=90,  # Twitter sends heartbeats every 20s
            ) as response:

                if response.status_code == 429:
                    logger.warning(
                        "Rate limited. Backing off for %.1fs", rate_limit_backoff
                    )
                    time.sleep(rate_limit_backoff)
                    rate_limit_backoff = min(rate_limit_backoff * 2, 300)
                    continue

                if response.status_code != 200:
                    logger.error(
                        "Stream error %d: %s",
                        response.status_code,
                        response.text[:500],
                    )
                    time.sleep(network_backoff)
                    network_backoff = min(network_backoff + 0.25, 16)
                    continue

                # Connected successfully — reset backoffs
                network_backoff = 0.25
                rate_limit_backoff = 1.0
                logger.info("Connected to Twitter Filtered Stream")

                for line in response.iter_lines():
                    if not line:
                        continue  # Heartbeat (empty line)

                    try:
                        tweet = json.loads(line)
                        if "data" in tweet:
                            publish_tweet(publisher, topic_path, tweet["data"])
                    except json.JSONDecodeError:
                        logger.warning("Malformed JSON from stream: %s", line[:200])
                    except Exception as e:
                        logger.error("Error processing tweet: %s", e)

        except requests.exceptions.ConnectionError as e:
            logger.warning("Connection lost: %s. Reconnecting in %.1fs", e, network_backoff)
            time.sleep(network_backoff)
            network_backoff = min(network_backoff + 0.25, 16)

        except Exception as e:
            logger.error("Unexpected error: %s. Reconnecting in 5s", e)
            time.sleep(5)


def main():
    logger.info("Starting Twitter Ingestor")
    setup_rules()

    publisher = create_publisher()
    topic_path = publisher.topic_path(GCP_PROJECT, PUBSUB_TOPIC.split("/")[-1])

    logger.info("Publishing to %s", topic_path)
    connect_to_stream(publisher, topic_path)


if __name__ == "__main__":
    main()
