###############################################################################
# IAM — One Service Account Per Boundary, Minimal Permissions
#
# Design principle: If the Twitter ingestor is compromised, the attacker
# can ONLY publish to raw-twitter. They cannot read from any subscription,
# cannot touch BigQuery, and cannot invoke other Cloud Run services.
###############################################################################

# ── Ingestion Service Accounts ──────────────────────────────────────────────

resource "google_service_account" "twitter_ingestor" {
  account_id   = "sa-twitter-ingestor"
  display_name = "Twitter Stream Ingestor"
  description  = "Publishes raw tweets to Pub/Sub. No other permissions."
}

resource "google_service_account" "youtube_ingestor" {
  account_id   = "sa-youtube-ingestor"
  display_name = "YouTube Live Chat Ingestor"
  description  = "Publishes raw YouTube chat messages to Pub/Sub."
}

resource "google_service_account" "whatsapp_ingestor" {
  account_id   = "sa-whatsapp-ingestor"
  display_name = "WhatsApp Webhook Ingestor"
  description  = "Publishes raw WhatsApp messages to Pub/Sub."
}

# ── Processing Service Accounts ─────────────────────────────────────────────

resource "google_service_account" "ml_consumer" {
  account_id   = "sa-ml-consumer"
  display_name = "ML Emotion Consumer"
  description  = "Pulls from normalized topic, calls Gemini, writes to BigQuery."
}

resource "google_service_account" "api_server" {
  account_id   = "sa-api-server"
  display_name = "API & WebSocket Server"
  description  = "Reads from BigQuery, serves REST/WS endpoints."
}

resource "google_service_account" "spike_detector" {
  account_id   = "sa-spike-detector"
  display_name = "Spike Detector"
  description  = "Reads BigQuery for viral detection, publishes alerts to Pub/Sub."
}

# ── Pub/Sub Publisher Bindings (Topic-Scoped) ───────────────────────────────

resource "google_pubsub_topic_iam_member" "twitter_publisher" {
  topic  = google_pubsub_topic.raw_twitter.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.twitter_ingestor.email}"
}

resource "google_pubsub_topic_iam_member" "youtube_publisher" {
  topic  = google_pubsub_topic.raw_youtube.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.youtube_ingestor.email}"
}

resource "google_pubsub_topic_iam_member" "whatsapp_publisher" {
  topic  = google_pubsub_topic.raw_whatsapp.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.whatsapp_ingestor.email}"
}

# Spike detector publishes alerts
resource "google_pubsub_topic_iam_member" "spike_alert_publisher" {
  topic  = google_pubsub_topic.spike_alerts.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.spike_detector.email}"
}

# ── Pub/Sub Subscriber Bindings ─────────────────────────────────────────────

resource "google_pubsub_subscription_iam_member" "ml_consumer_twitter" {
  subscription = google_pubsub_subscription.ml_consumer_twitter.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.ml_consumer.email}"
}

resource "google_pubsub_subscription_iam_member" "ml_consumer_youtube" {
  subscription = google_pubsub_subscription.ml_consumer_youtube.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.ml_consumer.email}"
}

resource "google_pubsub_subscription_iam_member" "ml_consumer_whatsapp" {
  subscription = google_pubsub_subscription.ml_consumer_whatsapp.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.ml_consumer.email}"
}

# API server subscribes to spike alerts for WebSocket broadcast
resource "google_pubsub_subscription_iam_member" "api_spike_alerts" {
  subscription = google_pubsub_subscription.api_spike_alerts.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.api_server.email}"
}

# ── BigQuery Bindings ───────────────────────────────────────────────────────

resource "google_project_iam_member" "ml_consumer_bq_writer" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.ml_consumer.email}"
}

resource "google_project_iam_member" "api_server_bq_reader" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.api_server.email}"
}

resource "google_project_iam_member" "spike_detector_bq_reader" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.spike_detector.email}"
}

# BigQuery job runner (needed to execute queries)
resource "google_project_iam_member" "api_server_bq_job" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.api_server.email}"
}

resource "google_project_iam_member" "spike_detector_bq_job" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.spike_detector.email}"
}

# ── Vertex AI / Gemini Binding ──────────────────────────────────────────────

resource "google_project_iam_member" "ml_consumer_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ml_consumer.email}"
}

# ── Secret Manager Access ──────────────────────────────────────────────────

resource "google_project_iam_member" "twitter_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.twitter_ingestor.email}"
}

resource "google_project_iam_member" "youtube_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.youtube_ingestor.email}"
}

resource "google_project_iam_member" "whatsapp_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.whatsapp_ingestor.email}"
}
