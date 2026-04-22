###############################################################################
# Pub/Sub Topology
#
# Architecture:
#   [ Twitter ] ──► [ raw-twitter ]  ──► [ ml-consumer-twitter-sub ]  ──►  ML Consumer
#   [ YouTube ] ──► [ raw-youtube ]  ──► [ ml-consumer-youtube-sub ]  ──►  ML Consumer
#   [ WhatsApp] ──► [ raw-whatsapp ] ──► [ ml-consumer-whatsapp-sub ] ──►  ML Consumer
#
#   Each source has its own topic so a poison-pill in one source doesn't
#   cascade across the entire pipeline. The ML Consumer pulls from all three
#   subscriptions independently.
#
#   Dead-letter topics catch malformed payloads after 5 failed delivery attempts.
#   spike-alerts topic is used for real-time WebSocket broadcast.
###############################################################################

# ── Dead Letter Topic (shared) ──────────────────────────────────────────────

resource "google_pubsub_topic" "dead_letter" {
  name = "dead-letter-emotions"

  message_retention_duration = "604800s" # 7 days — investigate at leisure
}

resource "google_pubsub_subscription" "dead_letter_sink" {
  name                       = "dead-letter-sink"
  topic                      = google_pubsub_topic.dead_letter.id
  ack_deadline_seconds       = 600
  message_retention_duration = "604800s"
}

# ── Raw Twitter Topic ───────────────────────────────────────────────────────

resource "google_pubsub_topic" "raw_twitter" {
  name = "raw-twitter"

  message_retention_duration = var.pubsub_message_retention

  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

resource "google_pubsub_subscription" "ml_consumer_twitter" {
  name  = "ml-consumer-twitter-sub"
  topic = google_pubsub_topic.raw_twitter.id

  ack_deadline_seconds       = 30
  message_retention_duration = var.pubsub_message_retention
  retain_acked_messages      = false

  # Exactly-once delivery for dedup guarantees
  enable_exactly_once_delivery = true

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = var.dead_letter_max_delivery_attempts
  }

  retry_policy {
    minimum_backoff = "1s"
    maximum_backoff = "60s"
  }

  expiration_policy {
    ttl = "" # Never expire
  }
}

# ── Raw YouTube Topic ───────────────────────────────────────────────────────

resource "google_pubsub_topic" "raw_youtube" {
  name = "raw-youtube"

  message_retention_duration = var.pubsub_message_retention

  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

resource "google_pubsub_subscription" "ml_consumer_youtube" {
  name  = "ml-consumer-youtube-sub"
  topic = google_pubsub_topic.raw_youtube.id

  ack_deadline_seconds       = 30
  message_retention_duration = var.pubsub_message_retention
  retain_acked_messages      = false

  enable_exactly_once_delivery = true

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = var.dead_letter_max_delivery_attempts
  }

  retry_policy {
    minimum_backoff = "1s"
    maximum_backoff = "60s"
  }

  expiration_policy {
    ttl = ""
  }
}

# ── Raw WhatsApp Topic ──────────────────────────────────────────────────────

resource "google_pubsub_topic" "raw_whatsapp" {
  name = "raw-whatsapp"

  message_retention_duration = var.pubsub_message_retention

  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

resource "google_pubsub_subscription" "ml_consumer_whatsapp" {
  name  = "ml-consumer-whatsapp-sub"
  topic = google_pubsub_topic.raw_whatsapp.id

  ack_deadline_seconds       = 30
  message_retention_duration = var.pubsub_message_retention
  retain_acked_messages      = false

  enable_exactly_once_delivery = true

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = var.dead_letter_max_delivery_attempts
  }

  retry_policy {
    minimum_backoff = "1s"
    maximum_backoff = "60s"
  }

  expiration_policy {
    ttl = ""
  }
}

# ── Spike Alerts Topic (Phase 3 → Phase 4) ─────────────────────────────────

resource "google_pubsub_topic" "spike_alerts" {
  name = "spike-alerts"

  message_retention_duration = "3600s" # 1 hour — ephemeral alerts
}

resource "google_pubsub_subscription" "api_spike_alerts" {
  name  = "api-spike-alerts-sub"
  topic = google_pubsub_topic.spike_alerts.id

  ack_deadline_seconds       = 10
  message_retention_duration = "3600s"

  expiration_policy {
    ttl = ""
  }
}

# ── Moment Card Events Topic ────────────────────────────────────────────────

resource "google_pubsub_topic" "moment_cards" {
  name = "moment-card-events"

  message_retention_duration = "7200s" # 2 hours
}

resource "google_pubsub_subscription" "api_moment_cards" {
  name  = "api-moment-cards-sub"
  topic = google_pubsub_topic.moment_cards.id

  ack_deadline_seconds       = 10
  message_retention_duration = "7200s"

  expiration_policy {
    ttl = ""
  }
}
