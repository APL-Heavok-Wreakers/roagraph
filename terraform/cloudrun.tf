###############################################################################
# Cloud Run Services
###############################################################################

# ── Twitter Ingestor ────────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "twitter_ingestor" {
  name     = "twitter-ingestor"
  location = var.region

  template {
    service_account = google_service_account.twitter_ingestor.email

    scaling {
      min_instance_count = 2   # Always warm — can't afford cold starts mid-stream
      max_instance_count = 10
    }

    containers {
      image = var.twitter_ingestor_image

      resources {
        limits   = { cpu = "1000m", memory = "512Mi" }
        cpu_idle = false  # CPU always allocated for persistent SSE connection
      }

      env { name = "PUBSUB_TOPIC"; value = google_pubsub_topic.raw_twitter.id }
      env { name = "GCP_PROJECT";  value = var.project_id }
    }

    timeout = "3600s"  # 1 hour max — service reconnects on expiry
    max_instance_request_concurrency = 80
  }

  traffic { type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"; percent = 100 }
}

# ── YouTube Ingestor ────────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "youtube_ingestor" {
  name     = "youtube-ingestor"
  location = var.region

  template {
    service_account = google_service_account.youtube_ingestor.email

    scaling {
      min_instance_count = 2
      max_instance_count = 10
    }

    containers {
      image = var.youtube_ingestor_image

      resources {
        limits   = { cpu = "1000m", memory = "512Mi" }
        cpu_idle = false  # Needs constant CPU for aggressive polling loop
      }

      env { name = "PUBSUB_TOPIC"; value = google_pubsub_topic.raw_youtube.id }
      env { name = "GCP_PROJECT";  value = var.project_id }
    }

    timeout = "3600s"
    max_instance_request_concurrency = 10
  }

  traffic { type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"; percent = 100 }
}

# ── WhatsApp Ingestor ───────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "whatsapp_ingestor" {
  name     = "whatsapp-ingestor"
  location = var.region

  template {
    service_account = google_service_account.whatsapp_ingestor.email

    scaling {
      min_instance_count = 2
      max_instance_count = 20  # Higher max — webhooks are bursty after wickets
    }

    containers {
      image = var.whatsapp_ingestor_image

      resources {
        limits = { cpu = "1000m", memory = "256Mi" }
      }

      env { name = "PUBSUB_TOPIC"; value = google_pubsub_topic.raw_whatsapp.id }
      env { name = "GCP_PROJECT";  value = var.project_id }
    }

    timeout = "60s"
    max_instance_request_concurrency = 250  # Webhook payloads are tiny
  }

  traffic { type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"; percent = 100 }
}

# ── ML Emotion Consumer ────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "ml_consumer" {
  name     = "ml-emotion-consumer"
  location = var.region

  template {
    service_account = google_service_account.ml_consumer.email

    scaling {
      min_instance_count = 5    # Pre-warmed for match start
      max_instance_count = 100  # World Cup final scale
    }

    containers {
      image = var.ml_consumer_image

      resources {
        limits   = { cpu = "2000m", memory = "1Gi" }
        cpu_idle = false  # NLP needs sustained CPU
      }

      env { name = "GCP_PROJECT";  value = var.project_id }
      env { name = "BQ_DATASET";   value = var.bq_dataset_id }
    }

    timeout = "300s"
    max_instance_request_concurrency = 10  # Low — each request does heavy NLP
  }

  traffic { type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"; percent = 100 }
}

# ── API Server ──────────────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "api_server" {
  name     = "api-server"
  location = var.region

  template {
    service_account = google_service_account.api_server.email

    scaling {
      min_instance_count = 3
      max_instance_count = 50
    }

    containers {
      image = var.api_server_image

      resources {
        limits   = { cpu = "2000m", memory = "1Gi" }
        cpu_idle = false  # WebSocket connections need persistent CPU
      }

      env { name = "GCP_PROJECT"; value = var.project_id }
      env { name = "BQ_DATASET";  value = var.bq_dataset_id }
    }

    timeout = "3600s"  # WebSocket connections last up to 60 min
    max_instance_request_concurrency = 100
  }

  traffic { type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"; percent = 100 }
}

# ── Spike Detector ──────────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "spike_detector" {
  name     = "spike-detector"
  location = var.region

  template {
    service_account = google_service_account.spike_detector.email

    scaling {
      min_instance_count = 1
      max_instance_count = 5
    }

    containers {
      image = var.spike_detector_image

      resources {
        limits   = { cpu = "1000m", memory = "512Mi" }
        cpu_idle = false  # Runs continuous polling loop
      }

      env { name = "GCP_PROJECT";    value = var.project_id }
      env { name = "BQ_DATASET";     value = var.bq_dataset_id }
      env { name = "ALERT_TOPIC_ID"; value = google_pubsub_topic.spike_alerts.id }
    }

    timeout = "3600s"
    max_instance_request_concurrency = 1  # Singleton worker
  }

  traffic { type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"; percent = 100 }
}
