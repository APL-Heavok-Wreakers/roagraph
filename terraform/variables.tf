###############################################################################
# Real-Time Cricket Emotion Analytics Platform — Variables
###############################################################################

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "asia-south1" # Mumbai — closest to India's cricket audience
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# ---------- Pub/Sub ----------
variable "pubsub_message_retention" {
  description = "How long Pub/Sub retains acknowledged messages (seconds). 7h covers a full match + buffer."
  type        = string
  default     = "25200s" # 7 hours
}

variable "dead_letter_max_delivery_attempts" {
  description = "Number of delivery attempts before routing to the dead-letter topic"
  type        = number
  default     = 5
}

# ---------- Cloud Run ----------
variable "twitter_ingestor_image" {
  type    = string
  default = ""
}

variable "youtube_ingestor_image" {
  type    = string
  default = ""
}

variable "whatsapp_ingestor_image" {
  type    = string
  default = ""
}

variable "ml_consumer_image" {
  type    = string
  default = ""
}

variable "api_server_image" {
  type    = string
  default = ""
}

variable "spike_detector_image" {
  type    = string
  default = ""
}

# ---------- BigQuery ----------
variable "bq_dataset_id" {
  description = "BigQuery dataset ID"
  type        = string
  default     = "cricket_emotions"
}

variable "bq_table_expiration_ms" {
  description = "Default table expiration in milliseconds (null = no expiration)"
  type        = number
  default     = null
}
