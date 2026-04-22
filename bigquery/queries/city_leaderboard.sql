-- =============================================================================
-- City Emotion Leaderboard
-- =============================================================================
-- Returns the top N cities by emotion intensity in the last 5 minutes.
-- Used for the real-time geo heatmap on the dashboard.
--
-- Normalization: cities with fewer than 10 messages in the window are excluded
-- to prevent small-sample outliers from dominating the leaderboard.
-- =============================================================================

WITH city_stats AS (
  SELECT
    city,
    state,
    country,
    COUNT(*) AS message_count,
    AVG(emotion_intensity) AS avg_intensity,
    APPROX_TOP_COUNT(primary_emotion, 1)[OFFSET(0)].value AS dominant_emotion,
    AVG(team_a_sentiment) AS team_a_sentiment,
    AVG(team_b_sentiment) AS team_b_sentiment
  FROM `{project}.{dataset}.raw_emotions`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 300 SECOND)
    AND match_id = @match_id
    AND city IS NOT NULL
    AND city != ''
  GROUP BY city, state, country
  HAVING COUNT(*) >= 10  -- Minimum sample size to avoid noise
)

SELECT
  city,
  state,
  country,
  message_count,
  avg_intensity,
  dominant_emotion,
  team_a_sentiment,
  team_b_sentiment,
  -- Rank by a composite score: intensity × log(volume) to balance both
  avg_intensity * LN(message_count + 1) AS composite_score
FROM city_stats
ORDER BY composite_score DESC
LIMIT @top_n
