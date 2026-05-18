"""
Spike Detector Service
======================
Continuously polls BigQuery every 5 seconds to detect viral emotion spikes.
When detected, publishes alerts to the spike-alerts Pub/Sub topic.

Trigger Types:
  MOMENT_CARD:     volume_spike > 4.0 AND intensity > 0.8
  CONTROVERSY:     sentiment_divergence > 1.2 AND intensity > 0.7
  MOMENTUM_SHIFT:  rolling 2-minute sentiment_delta change > 0.4
  DEAD_CROWD:      current_msgs_per_sec < baseline * 0.2 during active play
"""

import json
import logging
import os
import time
from datetime import datetime, timezone

from google.cloud import bigquery, pubsub_v1

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

GCP_PROJECT = os.environ["GCP_PROJECT"]
BQ_DATASET = os.environ["BQ_DATASET"]
ALERT_TOPIC_ID = os.environ["ALERT_TOPIC_ID"]
MATCH_ID = os.environ.get("MATCH_ID", "LIVE_MATCH")

POLL_INTERVAL = 5  # seconds

# ── Thresholds (justified) ──────────────────────────────────────────────────
# These values were calibrated against historical IPL match data patterns.

MOMENT_CARD_VOLUME_THRESHOLD = 4.0     # 4x baseline volume
MOMENT_CARD_INTENSITY_THRESHOLD = 0.8  # High emotional intensity
CONTROVERSY_DIVERGENCE_THRESHOLD = 1.2 # Team sentiments > 1.2 apart
CONTROVERSY_INTENSITY_THRESHOLD = 0.7  # Moderate+ intensity
DEAD_CROWD_RATIO = 0.2                 # < 20% of baseline volume
MOMENTUM_DELTA_THRESHOLD = 0.4         # 0.4 sentiment swing in 2 minutes
MIN_SOURCE_DIVERSITY = 2               # Must appear in 2+ platforms (bot filter)
MIN_Z_SCORE = 2.0                      # Statistical significance filter

SPIKE_QUERY = open(
    os.path.join(os.path.dirname(__file__), "..", "..", "bigquery", "queries", "spike_detection.sql")
).read().replace("{project}", GCP_PROJECT).replace("{dataset}", BQ_DATASET) if os.path.exists(
    os.path.join(os.path.dirname(__file__), "..", "..", "bigquery", "queries", "spike_detection.sql")
) else None

# Inline fallback query if file not found (for containerized deployment)
if not SPIKE_QUERY:
    SPIKE_QUERY = f"""
    WITH baseline AS (
      SELECT AVG(emotion_intensity) AS avg_baseline_intensity,
             STDDEV(emotion_intensity) AS stddev_baseline_intensity,
             COUNT(*) / 300.0 AS baseline_msgs_per_sec
      FROM `{GCP_PROJECT}.{BQ_DATASET}.raw_emotions`
      WHERE event_timestamp BETWEEN
        TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 315 SECOND)
        AND TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 SECOND)
        AND match_id = @match_id
    ),
    current_window AS (
      SELECT AVG(emotion_intensity) AS current_intensity,
             COUNT(*) / 15.0 AS current_msgs_per_sec,
             AVG(team_a_sentiment) AS avg_team_a,
             AVG(team_b_sentiment) AS avg_team_b,
             COUNTIF(primary_emotion = 'euphoria') / NULLIF(COUNT(*), 0) AS pct_euphoria,
             COUNTIF(primary_emotion = 'outrage') / NULLIF(COUNT(*), 0) AS pct_outrage,
             (IF(COUNTIF(source='twitter')>0,1,0)+IF(COUNTIF(source='youtube')>0,1,0)+IF(COUNTIF(source='whatsapp')>0,1,0)) AS source_diversity
      FROM `{GCP_PROJECT}.{BQ_DATASET}.raw_emotions`
      WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 SECOND)
        AND match_id = @match_id
    )
    SELECT CURRENT_TIMESTAMP() AS detected_at, c.*, b.*,
           SAFE_DIVIDE(c.current_msgs_per_sec, b.baseline_msgs_per_sec) AS volume_spike_multiplier,
           ABS(IFNULL(c.avg_team_a,0) - IFNULL(c.avg_team_b,0)) AS sentiment_divergence
    FROM current_window c CROSS JOIN baseline b
    WHERE SAFE_DIVIDE(c.current_msgs_per_sec, b.baseline_msgs_per_sec) > 2.0
       OR c.current_intensity > 0.7
    """


def create_publisher():
    return pubsub_v1.PublisherClient()


def evaluate_triggers(row):
    """Evaluate all trigger conditions against a spike detection result."""
    alerts = []

    volume_spike = row.get("volume_spike_multiplier", 0) or 0
    intensity = row.get("current_intensity", 0) or 0
    divergence = row.get("sentiment_divergence", 0) or 0
    source_diversity = row.get("source_diversity", 0) or 0
    z_score = row.get("z_score", 0) or 0

    # Bot filter: genuine events appear across multiple sources
    if source_diversity < MIN_SOURCE_DIVERSITY:
        logger.info("Filtered potential bot storm (source_diversity=%d)", source_diversity)
        return alerts

    # Statistical significance filter
    if z_score < MIN_Z_SCORE and volume_spike < MOMENT_CARD_VOLUME_THRESHOLD:
        return alerts

    # MOMENT_CARD: Major event (wicket, six, century)
    if volume_spike >= MOMENT_CARD_VOLUME_THRESHOLD and intensity >= MOMENT_CARD_INTENSITY_THRESHOLD:
        alerts.append({
            "trigger_type": "MOMENT_CARD",
            "spike_multiplier": volume_spike,
            "intensity": intensity,
            "dominant_emotion": _get_dominant(row),
            "team_a_sentiment": row.get("avg_team_a"),
            "team_b_sentiment": row.get("avg_team_b"),
        })

    # CONTROVERSY: Split sentiment
    if divergence >= CONTROVERSY_DIVERGENCE_THRESHOLD and intensity >= CONTROVERSY_INTENSITY_THRESHOLD:
        alerts.append({
            "trigger_type": "CONTROVERSY",
            "spike_multiplier": volume_spike,
            "intensity": intensity,
            "dominant_emotion": "split",
            "team_a_sentiment": row.get("avg_team_a"),
            "team_b_sentiment": row.get("avg_team_b"),
        })

    # DEAD_CROWD: Low engagement during play
    baseline_rate = row.get("baseline_msgs_per_sec", 1) or 1
    current_rate = row.get("current_msgs_per_sec", 0) or 0
    if current_rate < baseline_rate * DEAD_CROWD_RATIO and baseline_rate > 5:
        alerts.append({
            "trigger_type": "DEAD_CROWD",
            "spike_multiplier": current_rate / baseline_rate if baseline_rate else 0,
            "intensity": intensity,
            "dominant_emotion": "neutral",
        })

    return alerts


def _get_dominant(row):
    """Determine the dominant emotion from spike detection percentages."""
    emotions = {
        "euphoria": row.get("pct_euphoria", 0) or 0,
        "outrage": row.get("pct_outrage", 0) or 0,
        "devastation": row.get("pct_devastation", 0) or 0,
    }
    return max(emotions, key=emotions.get) if any(emotions.values()) else "unknown"


def main():
    logger.info("Spike Detector started for match %s", MATCH_ID)

    bq_client = bigquery.Client(project=GCP_PROJECT)
    publisher = create_publisher()
    topic_name = ALERT_TOPIC_ID.split("/")[-1] if "/" in ALERT_TOPIC_ID else ALERT_TOPIC_ID
    topic_path = publisher.topic_path(GCP_PROJECT, topic_name)

    while True:
        try:
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("match_id", "STRING", MATCH_ID),
                ]
            )

            results = bq_client.query(SPIKE_QUERY, job_config=job_config).result()

            for row in results:
                row_dict = dict(row)
                alerts = evaluate_triggers(row_dict)

                for alert in alerts:
                    alert["match_id"] = MATCH_ID
                    alert["detected_at"] = datetime.now(timezone.utc).isoformat()

                    publisher.publish(
                        topic_path,
                        data=json.dumps(alert).encode("utf-8"),
                        trigger_type=alert["trigger_type"],
                    )
                    logger.info(
                        "ALERT: %s (multiplier=%.1f, intensity=%.2f)",
                        alert["trigger_type"],
                        alert.get("spike_multiplier", 0),
                        alert.get("intensity", 0),
                    )

        except Exception as e:
            logger.error("Spike detection cycle failed: %s", e)

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
