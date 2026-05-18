###############################################################################
# BigQuery — Analytics Brain Storage Layer
###############################################################################

resource "google_bigquery_dataset" "cricket_emotions" {
  dataset_id    = var.bq_dataset_id
  friendly_name = "Cricket Emotion Analytics"
  description   = "Real-time emotion signals from live cricket matches"
  location      = "asia-south1"
  default_table_expiration_ms = var.bq_table_expiration_ms
  labels = { environment = var.environment, domain = "cricket-emotions" }
}

resource "google_bigquery_table" "raw_emotions" {
  dataset_id = google_bigquery_dataset.cricket_emotions.dataset_id
  table_id   = "raw_emotions"
  time_partitioning { type = "HOUR"; field = "event_timestamp" }
  clustering = ["match_id", "source", "primary_emotion"]
  deletion_protection = true
  schema = file("${path.module}/../bigquery/schemas/raw_emotions.json")
}

resource "google_bigquery_table" "over_aggregations" {
  dataset_id = google_bigquery_dataset.cricket_emotions.dataset_id
  table_id   = "over_aggregations"
  time_partitioning { type = "DAY"; field = "computed_at" }
  clustering = ["match_id", "innings", "over_number"]
  deletion_protection = false
  schema = file("${path.module}/../bigquery/schemas/over_aggregations.json")
}

resource "google_bigquery_table" "moment_cards" {
  dataset_id = google_bigquery_dataset.cricket_emotions.dataset_id
  table_id   = "moment_cards"
  time_partitioning { type = "DAY"; field = "created_at" }
  clustering = ["match_id", "trigger_type"]
  deletion_protection = false
  schema = file("${path.module}/../bigquery/schemas/moment_cards.json")
}

resource "google_bigquery_table" "city_emotions" {
  dataset_id = google_bigquery_dataset.cricket_emotions.dataset_id
  table_id   = "city_emotions"
  time_partitioning { type = "HOUR"; field = "snapshot_timestamp" }
  clustering = ["match_id", "city"]
  deletion_protection = false
  schema = file("${path.module}/../bigquery/schemas/city_emotions.json")
}
