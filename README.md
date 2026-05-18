# 🏏 RoarGraph — Real-Time Cricket Emotion Analytics Platform

> *When the crowd roars, we graph it.*

A GCP-native platform that captures, classifies, and delivers **real-time emotional intelligence** from millions of cricket fans across Twitter/X, YouTube Live Chat, and WhatsApp during live matches.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INGESTION LAYER (Phase 1)                        │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │   Twitter     │  │   YouTube    │  │   WhatsApp   │                    │
│  │   Filtered    │  │   Live Chat  │  │   Webhook    │                    │
│  │   Stream v2   │  │   Polling    │  │   (Meta API) │                    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                    │
│         │                  │                  │                            │
│         ▼                  ▼                  ▼                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │ raw-twitter  │  │ raw-youtube  │  │ raw-whatsapp │   Pub/Sub Topics   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                      │
│         └────────────────┼────────────────┘                              │
│                          ▼                                                │
│              ┌───────────────────────┐        ┌────────────────┐         │
│              │   Dead Letter Topic   │◄───────│  Failed msgs   │         │
│              └───────────────────────┘        └────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ML EMOTION CORE (Phase 2)                         │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────┐             │
│  │  ML Emotion Consumer (Cloud Run)                         │             │
│  │                                                          │             │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │             │
│  │  │ Preprocess  │─▶│ Rule-Based │─▶│  Cloud NL API     │  │             │
│  │  │ (emoji,     │  │ Fast Path  │  │  Medium Path      │  │             │
│  │  │  lang det)  │  └─────┬──────┘  └────────┬──────────┘  │             │
│  │  └────────────┘        │                   │              │             │
│  │                        │         ┌─────────▼──────────┐  │             │
│  │                        └────────▶│  Gemini Deep Path   │  │             │
│  │                                  │  (Hinglish, slang,  │  │             │
│  │                                  │   irony, emotion)   │  │             │
│  │                                  └─────────────────────┘  │             │
│  └──────────────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ANALYTICS BRAIN (Phase 3)                           │
│                                                                           │
│  ┌─────────────────┐  ┌────────────────────┐  ┌──────────────────┐       │
│  │  BigQuery        │  │  Spike Detector     │  │  Scheduled       │       │
│  │  raw_emotions    │  │  (every 5s)         │  │  Queries         │       │
│  │  over_aggs       │  │  Volume × Intensity │  │  (over summary,  │       │
│  │  moment_cards    │  │  Bot filtering      │  │   city leaders)  │       │
│  │  city_emotions   │  │  Z-score validation │  │                  │       │
│  └─────────────────┘  └─────────┬────────────┘  └──────────────────┘       │
│                                 │                                         │
│                    ┌────────────▼─────────────┐                           │
│                    │  spike-alerts Pub/Sub     │                           │
│                    │  moment-card-events       │                           │
│                    └────────────┬─────────────┘                           │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DATA DELIVERY LAYER (Phase 4)                         │
│                                                                           │
│  ┌────────────────────────────────────────────────────────┐               │
│  │  API Server (Cloud Run)                                 │               │
│  │                                                        │               │
│  │  REST: /live-emotions, /over-summary, /city-split,     │               │
│  │        /moment-cards, /health                          │               │
│  │                                                        │               │
│  │  WebSocket: /ws/{match_id}                             │               │
│  │    Events: EMOTION_PULSE, SPIKE_ALERT,                 │               │
│  │            MOMENT_CARD_CREATED, CITY_UPDATE             │               │
│  │    Reconnection: circular buffer replay                │               │
│  └────────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
RoarGraph/
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # Provider config, API enablement
│   ├── variables.tf              # All configurable parameters
│   ├── iam.tf                    # Service accounts & permissions
│   ├── pubsub.tf                 # Topics, subscriptions, DLTs
│   ├── cloudrun.tf               # All 6 Cloud Run service configs
│   ├── bigquery.tf               # Dataset and table definitions
│   └── outputs.tf                # Service URLs and resource IDs
│
├── services/
│   ├── twitter-ingestor/         # Filtered Stream v2 listener
│   ├── youtube-ingestor/         # Live Chat API poller
│   ├── whatsapp-ingestor/        # Meta Business API webhook
│   ├── ml-emotion-consumer/      # Preprocessing + Gemini classifier
│   ├── api-server/               # REST + WebSocket server
│   └── spike-detector/           # Real-time viral detection
│
├── bigquery/
│   ├── schemas/                  # Table schema JSON files
│   └── queries/                  # Spike detection, aggregation SQL
│
├── openapi/
│   └── spec.yaml                 # OpenAPI 3.0 specification
│
├── load-tests/
│   └── k6/                       # Load testing scripts
│
└── monitoring/
    └── dashboard.json            # Cloud Monitoring dashboard
```

## Quick Start

### 1. Deploy Infrastructure
```bash
cd terraform
terraform init
terraform plan -var="project_id=your-project-id"
terraform apply -var="project_id=your-project-id"
```

### 2. Build & Deploy Services
```bash
# Build all service images
for svc in twitter-ingestor youtube-ingestor whatsapp-ingestor ml-emotion-consumer api-server spike-detector; do
  gcloud builds submit services/$svc --tag gcr.io/PROJECT_ID/$svc
done

# Update Terraform with image URLs and re-apply
terraform apply \
  -var="twitter_ingestor_image=gcr.io/PROJECT_ID/twitter-ingestor" \
  -var="youtube_ingestor_image=gcr.io/PROJECT_ID/youtube-ingestor" \
  ...
```

### 3. Run Load Tests
```bash
k6 run load-tests/k6/load_test.js
```

## Anti-Gravity Challenges Solved

| Challenge | Solution |
|---|---|
| **10x spike at century** | Pub/Sub absorbs burst; Cloud Run autoscales to 100 instances; load shedding samples Gemini calls |
| **Split sentiment (controversy)** | Dual team_sentiment fields — never averaged; CONTROVERSY trigger fires on divergence > 1.2 |
| **Super Over recalibration** | All analytics use rolling time windows, never absolute over numbers |
| **WebSocket reconnection** | Circular buffer replays missed events via `last_seen_id` handshake |
| **95% capacity incident** | Load shedding dial: drop Moment Card generation, sample Gemini to 20%, keep core telemetry alive |

## Key Design Decisions

1. **Separate Pub/Sub topics per source** — Isolates failures. A YouTube API schema change won't crash the Twitter pipeline.
2. **Three-tier ML classification** — Rule-based (free) → Cloud NL API (cheap) → Gemini (powerful). Only ~30% of messages need Gemini.
3. **Flat BigQuery columns, not STRUCT** — Enables direct `WHERE primary_emotion = 'euphoria'` without UNNEST. Critical for sub-second spike detection queries.
4. **Bot filtering via source diversity** — A genuine cricket moment appears across Twitter, YouTube, AND WhatsApp simultaneously. A bot storm appears on only one platform.
