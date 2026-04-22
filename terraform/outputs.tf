###############################################################################
# Outputs
###############################################################################

output "twitter_ingestor_url" {
  value = google_cloud_run_v2_service.twitter_ingestor.uri
}

output "youtube_ingestor_url" {
  value = google_cloud_run_v2_service.youtube_ingestor.uri
}

output "whatsapp_ingestor_url" {
  value = google_cloud_run_v2_service.whatsapp_ingestor.uri
}

output "ml_consumer_url" {
  value = google_cloud_run_v2_service.ml_consumer.uri
}

output "api_server_url" {
  value = google_cloud_run_v2_service.api_server.uri
}

output "spike_detector_url" {
  value = google_cloud_run_v2_service.spike_detector.uri
}

output "pubsub_topics" {
  value = {
    raw_twitter  = google_pubsub_topic.raw_twitter.id
    raw_youtube  = google_pubsub_topic.raw_youtube.id
    raw_whatsapp = google_pubsub_topic.raw_whatsapp.id
    spike_alerts = google_pubsub_topic.spike_alerts.id
    moment_cards = google_pubsub_topic.moment_cards.id
    dead_letter  = google_pubsub_topic.dead_letter.id
  }
}

output "bigquery_dataset" {
  value = google_bigquery_dataset.cricket_emotions.dataset_id
}
