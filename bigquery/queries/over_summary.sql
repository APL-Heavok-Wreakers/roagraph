-- =============================================================================
-- Over-by-Over Emotion Summary
-- =============================================================================
-- Aggregates all emotion signals for a specific over.
-- Called after every 6 balls (or on demand for the current in-progress over).
-- =============================================================================

SELECT
  @match_id AS match_id,
  IFNULL(@innings, 1) AS innings,
  @over_number AS over_number,
  CURRENT_TIMESTAMP() AS computed_at,

  COUNT(*) AS message_count,
  AVG(emotion_intensity) AS avg_intensity,
  MAX(emotion_intensity) AS peak_intensity,

  -- Dominant emotion = the most frequent primary_emotion
  APPROX_TOP_COUNT(primary_emotion, 1)[OFFSET(0)].value AS dominant_emotion,

  -- Emotion distribution (percentages)
  COUNTIF(primary_emotion = 'joy') / COUNT(*) AS pct_joy,
  COUNTIF(primary_emotion = 'euphoria') / COUNT(*) AS pct_euphoria,
  COUNTIF(primary_emotion = 'outrage') / COUNT(*) AS pct_outrage,
  COUNTIF(primary_emotion = 'anxiety') / COUNT(*) AS pct_anxiety,
  COUNTIF(primary_emotion = 'devastation') / COUNT(*) AS pct_devastation,
  COUNTIF(primary_emotion = 'disbelief') / COUNT(*) AS pct_disbelief,
  COUNTIF(primary_emotion = 'neutral') / COUNT(*) AS pct_neutral,

  -- Team sentiment averages
  AVG(team_a_sentiment) AS team_a_avg_sentiment,
  AVG(team_b_sentiment) AS team_b_avg_sentiment,
  AVG(team_a_sentiment) - AVG(team_b_sentiment) AS sentiment_delta,

  -- Peak moment: timestamp of highest intensity message
  (SELECT event_timestamp FROM `{project}.{dataset}.raw_emotions`
   WHERE match_id = @match_id AND over_number = @over_number
   ORDER BY emotion_intensity DESC LIMIT 1) AS peak_moment_timestamp

FROM `{project}.{dataset}.raw_emotions`
WHERE match_id = @match_id
  AND over_number = @over_number
  AND (innings = @innings OR @innings IS NULL)
