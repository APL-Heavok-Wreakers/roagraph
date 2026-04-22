# 🔌 RoarGraph Frontend Integration Guide

> **For the frontend developer** — everything you need to connect to the backend.

## GitHub Repo
```
https://github.com/APL-Heavok-Wreakers/RoarGraph-
```

Clone it, create your frontend in `/frontend`, push to the same repo.

---

## Backend Base URL (Local Dev)
```
http://localhost:8000
```

## REST API Endpoints

### 1. GET `/live-emotions`
Live emotion distribution for the current match.
```
GET /live-emotions?match_id=IND_v_PAK_2026&window=60s&source=twitter,youtube
```
**Response:**
```json
{
  "distribution": { "euphoria": 0.30, "outrage": 0.18, "joy": 0.12, "anxiety": 0.10 },
  "message_count": 4200,
  "avg_intensity": 0.79,
  "window": "60s"
}
```

### 2. GET `/over-summary/{over_number}`
Emotion breakdown for a specific over.
```
GET /over-summary/18?match_id=IND_v_PAK_2026&innings=1
```
**Response:**
```json
{
  "over_number": 18,
  "message_count": 850,
  "avg_intensity": 0.82,
  "dominant_emotion": "anxiety",
  "pct_euphoria": 0.15,
  "pct_outrage": 0.25,
  "team_a_avg_sentiment": 0.4,
  "team_b_avg_sentiment": -0.6,
  "momentum_score": 0.35
}
```

### 3. GET `/city-split`
Top cities by emotion intensity — use for the geo heatmap.
```
GET /city-split?match_id=IND_v_PAK_2026&top_n=10
```
**Response:**
```json
{
  "cities": [
    {
      "city": "Mumbai", "state": "Maharashtra",
      "lat": 19.076, "lng": 72.877,
      "message_count": 520,
      "avg_intensity": 0.88,
      "dominant_emotion": "euphoria",
      "team_a_sentiment": 0.7,
      "team_b_sentiment": -0.5
    }
  ]
}
```

### 4. GET `/moment-cards`
Auto-generated highlight cards with Gemini narratives.
```
GET /moment-cards?match_id=IND_v_PAK_2026&limit=20&emotion=euphoria&min_intensity=0.7
```
**Response:**
```json
{
  "cards": [
    {
      "card_id": "a1b2c3d4",
      "trigger_type": "MOMENT_CARD",
      "created_at": "2026-04-22T15:30:00Z",
      "dominant_emotion": "euphoria",
      "intensity": 0.95,
      "spike_multiplier": 5.2,
      "narrative": "Kohli launches a helicopter shot into the stands..."
    }
  ],
  "next_cursor": "a1b2c3d4"
}
```

### 5. GET `/match-state`
Current match clock and system stats.
```json
{ "over": 18, "ball": 4, "innings": 2, "messages_ingested": 42000, "ws_clients": 12 }
```

---

## WebSocket (Real-Time Events)

### Connect
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/live');
```

### Reconnection (missed events replay)
```javascript
// Pass last_seen_id to get missed events replayed automatically
const ws = new WebSocket('ws://localhost:8000/ws/live?last_seen_id=evt_1234');
```

### Events You'll Receive

**EMOTION_PULSE** — every 0.5 seconds
```json
{
  "event": "EMOTION_PULSE",
  "event_id": "evt_1234",
  "timestamp": 1713800000,
  "data": {
    "global_intensity": 0.79,
    "distribution": { "euphoria": 0.30, "outrage": 0.18 },
    "top_emotion": "euphoria",
    "over": 18, "ball": 4,
    "message_rate": 10.5
  }
}
```

**SPIKE_ALERT** — instant, when a viral moment is detected
```json
{
  "event": "SPIKE_ALERT",
  "event_id": "evt_1235",
  "data": {
    "trigger_type": "MOMENT_CARD",
    "spike_multiplier": 5.2,
    "intensity": 0.95,
    "dominant_emotion": "euphoria"
  }
}
```

---

## Emotion Types (use these for colors/icons)
| Emotion | Suggested Color | Meaning |
|---------|----------------|---------|
| `joy` | `#00b894` | Positive, moderate |
| `euphoria` | `#fdcb6e` | Ecstatic, peak moment |
| `outrage` | `#e17055` | Angry, upset |
| `anxiety` | `#e056a0` | Tense, nervous |
| `devastation` | `#d63031` | Heartbroken |
| `disbelief` | `#0984e3` | Shocked |
| `neutral` | `#636e72` | Low signal |

---

## Git Workflow

```bash
git clone https://github.com/APL-Heavok-Wreakers/RoarGraph-.git
cd RoarGraph-

# Create frontend in /frontend directory
mkdir frontend
cd frontend
# ... build your React/Next.js/Vite app here ...

# Push your work
git add -A
git commit -m "feat: add frontend dashboard"
git push origin main
```

## Running Together Locally

```bash
# Terminal 1: Start backend
cd local-demo
python server.py
# Backend runs on http://localhost:8000

# Terminal 2: Start frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:3000 (or whatever port)
```

Frontend should proxy API calls to `http://localhost:8000`.

## Vercel Deployment

Once frontend is integrated, deploy from the repo root:
```bash
# In /frontend directory
npx vercel --prod
```

For the backend API in production, deploy to **Vercel Serverless Functions** or keep it on **GCP Cloud Run**.
