-- =============================================================================
-- Viral Spike Detection Query
-- =============================================================================
-- Runs every 5 seconds. Compares the last 15-second window against a rolling
-- 5-minute baseline. A spike_multiplier > 3.0 triggers an alert.
--
-- Why 15 seconds vs 5 minutes?
--   - 15s captures the instant reaction to a ball/event
--   - 5 minutes is long enough to be a stable baseline, short enough to
--     adapt to rising intensity (e.g., during death overs)
--
-- Anti-Gravity: Super Over Resilient
--   This query uses ONLY time windows, never over/innings numbers.
--   It works identically whether it's over 5 or a Super Over.
-- =============================================================================

WITH baseline AS (
  SELECT
    AVG(emotion_intensity) AS avg_baseline_intensity,
    STDDEV(emotion_intensity) AS stddev_baseline_intensity,
    COUNT(*) AS baseline_message_count,
    COUNT(*) / 300.0 AS baseline_msgs_per_sec,
    -- Emotion distribution in baseline period
    COUNTIF(primary_emotion = 'joy') / COUNT(*) AS baseline_pct_joy,
    COUNTIF(primary_emotion = 'euphoria') / COUNT(*) AS baseline_pct_euphoria,
    COUNTIF(primary_emotion = 'outrage') / COUNT(*) AS baseline_pct_outrage,
    COUNTIF(primary_emotion = 'anxiety') / COUNT(*) AS baseline_pct_anxiety,
    COUNTIF(primary_emotion = 'devastation') / COUNT(*) AS baseline_pct_devastation
  FROM `{project}.{dataset}.raw_emotions`
  WHERE event_timestamp BETWEEN
    TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 315 SECOND)
    AND TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 SECOND)
    AND match_id = @match_id
),

current_window AS (
  SELECT
    AVG(emotion_intensity) AS current_intensity,
    COUNT(*) AS current_message_count,
    COUNT(*) / 15.0 AS current_msgs_per_sec,
    -- Current emotion distribution
    COUNTIF(primary_emotion = 'joy') / NULLIF(COUNT(*), 0) AS pct_joy,
    COUNTIF(primary_emotion = 'euphoria') / NULLIF(COUNT(*), 0) AS pct_euphoria,
    COUNTIF(primary_emotion = 'outrage') / NULLIF(COUNT(*), 0) AS pct_outrage,
    COUNTIF(primary_emotion = 'anxiety') / NULLIF(COUNT(*), 0) AS pct_anxiety,
    COUNTIF(primary_emotion = 'devastation') / NULLIF(COUNT(*), 0) AS pct_devastation,
    -- Team sentiment split
    AVG(team_a_sentiment) AS avg_team_a,
    AVG(team_b_sentiment) AS avg_team_b,
    -- Source breakdown
    COUNTIF(source = 'twitter') AS twitter_count,
    COUNTIF(source = 'youtube') AS youtube_count,
    COUNTIF(source = 'whatsapp') AS whatsapp_count
  FROM `{project}.{dataset}.raw_emotions`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 SECOND)
    AND match_id = @match_id
)

SELECT
  CURRENT_TIMESTAMP() AS detected_at,
  c.current_intensity,
  c.current_msgs_per_sec,
  b.avg_baseline_intensity,
  b.baseline_msgs_per_sec,

  -- Spike multiplier: how many times above baseline
  SAFE_DIVIDE(c.current_msgs_per_sec, b.baseline_msgs_per_sec) AS volume_spike_multiplier,

  -- Intensity spike: is the emotion itself more intense?
  SAFE_DIVIDE(c.current_intensity, NULLIF(b.avg_baseline_intensity, 0)) AS intensity_spike_multiplier,

  -- Standard deviation check for false positive filtering
  -- A genuine spike should be > 2 stddevs above baseline
  SAFE_DIVIDE(
    c.current_intensity - b.avg_baseline_intensity,
    NULLIF(b.stddev_baseline_intensity, 0)
  ) AS z_score,

  -- Emotion distribution shift
  c.pct_euphoria,
  c.pct_outrage,
  c.pct_devastation,

  -- Team sentiment for controversy detection
  c.avg_team_a,
  c.avg_team_b,
  ABS(IFNULL(c.avg_team_a, 0) - IFNULL(c.avg_team_b, 0)) AS sentiment_divergence,

  -- Source diversity (bot filter: genuine events appear across multiple sources)
  c.twitter_count,
  c.youtube_count,
  c.whatsapp_count,
  (IF(c.twitter_count > 0, 1, 0) + IF(c.youtube_count > 0, 1, 0) + IF(c.whatsapp_count > 0, 1, 0)) AS source_diversity

FROM current_window c
CROSS JOIN baseline b

-- Only return if there IS a spike
WHERE SAFE_DIVIDE(c.current_msgs_per_sec, b.baseline_msgs_per_sec) > 3.0
   OR (c.current_intensity > 0.8 AND SAFE_DIVIDE(c.current_msgs_per_sec, b.baseline_msgs_per_sec) > 2.0)
