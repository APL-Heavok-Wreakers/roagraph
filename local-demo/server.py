"""
APL Local Demo Server
=====================
Self-contained simulation of the full cricket emotion pipeline.
No GCP credentials needed. Run with: python server.py
"""

import asyncio, json, random, time, uuid, math
from datetime import datetime, timezone
from collections import deque
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from ipl_api import get_current_ipl_matches, get_simulated_ipl_match

app = FastAPI(title="RoarGraph Cricket Emotion Demo")

# Current IPL match context (updated periodically)
ipl_match = get_simulated_ipl_match()

# ── In-Memory Storage ───────────────────────────────────────────────────────
emotions_store = deque(maxlen=10000)
moment_cards = []
event_buffer = deque(maxlen=500)
connected_clients: list[WebSocket] = []
match_clock = {"over": 1, "ball": 0, "innings": 1, "started_at": time.time()}

EMOTIONS = ["joy", "euphoria", "outrage", "anxiety", "devastation", "disbelief", "neutral"]
CITIES = [
    {"city": "Mumbai", "state": "Maharashtra", "lat": 19.076, "lng": 72.877},
    {"city": "Delhi", "state": "Delhi", "lat": 28.613, "lng": 77.209},
    {"city": "Bangalore", "state": "Karnataka", "lat": 12.971, "lng": 77.594},
    {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.082, "lng": 80.270},
    {"city": "Kolkata", "state": "West Bengal", "lat": 22.572, "lng": 88.363},
    {"city": "Hyderabad", "state": "Telangana", "lat": 17.385, "lng": 78.486},
    {"city": "Pune", "state": "Maharashtra", "lat": 18.520, "lng": 73.856},
    {"city": "Ahmedabad", "state": "Gujarat", "lat": 23.022, "lng": 72.571},
    {"city": "Jaipur", "state": "Rajasthan", "lat": 26.912, "lng": 75.787},
    {"city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.846, "lng": 80.946},
]

SYNTHETIC_MESSAGES = [
    ("WHAT A SHOT KOHLI 🔥🔥🔥 THIS IS UNREAL!!!", "euphoria", 0.95),
    ("SIX!!! MASSIVE SIX INTO THE STANDS!! 💪💪", "euphoria", 0.92),
    ("Iske baad toh gaya match 😭 no hope left", "devastation", 0.80),
    ("HOW IS THAT NOT OUT??? UMPIRE IS BLIND 😡", "outrage", 0.88),
    ("bumrah aag laga raha hai 🔥 unstoppable", "joy", 0.85),
    ("last ball pe 6 chahiye 🙏🙏 cant watch", "anxiety", 0.90),
    ("CAUGHT!! WHAT A CATCH BY JADEJA!!", "euphoria", 0.93),
    ("boring cricket yaar dot dot dot 😴", "neutral", 0.20),
    ("controversy! that was clearly a no ball", "outrage", 0.82),
    ("yeh match toh gaya 😭😭 devastated", "devastation", 0.85),
    ("CENTURY FOR ROHIT!! 💯 HITMAN!!", "euphoria", 0.97),
    ("dropped catch HOW DO YOU DROP THAT 🤦", "outrage", 0.78),
    ("dil dhadak raha hai last over 🫣", "anxiety", 0.88),
    ("WICKET! BOWLED HIM!! STUMPS FLYING!!", "euphoria", 0.94),
    ("good shot but not enough pressure", "neutral", 0.35),
    ("come on india we can do this 🇮🇳", "joy", 0.70),
    ("what a delivery absolute peach 🍑", "joy", 0.75),
    ("NO BALL??? CHECK THAT AGAIN REF", "outrage", 0.80),
    ("I cant believe what im watching 😱", "disbelief", 0.90),
    ("heartbreaking loss 💔 we deserved more", "devastation", 0.88),
]


def generate_message():
    """Generate a synthetic emotion-classified message."""
    text, emotion, base_intensity = random.choice(SYNTHETIC_MESSAGES)
    noise = random.uniform(-0.1, 0.1)
    intensity = max(0.1, min(1.0, base_intensity + noise))
    city = random.choice(CITIES)
    source = random.choices(["twitter", "youtube", "whatsapp"], weights=[50, 30, 20])[0]

    team_a = random.uniform(0.3, 1.0) if emotion in ("joy", "euphoria") else random.uniform(-1.0, -0.2)
    team_b = -team_a * random.uniform(0.5, 1.0)

    return {
        "message_id": f"{source}_{uuid.uuid4().hex[:12]}",
        "match_id": "IND_v_PAK_2026",
        "source": source,
        "event_timestamp": datetime.now(timezone.utc).isoformat(),
        "raw_text": text,
        "primary_emotion": emotion,
        "emotion_intensity": round(intensity, 3),
        "team_a_sentiment": round(team_a, 3),
        "team_b_sentiment": round(team_b, 3),
        "city": city["city"],
        "state": city["state"],
        "over_number": match_clock["over"],
        "ball_number": match_clock["ball"],
    }


def detect_spike():
    """Check if current activity is a spike vs baseline."""
    now = time.time()
    recent = [e for e in emotions_store if now - e["_ts"] < 15]
    baseline = [e for e in emotions_store if 15 < now - e["_ts"] < 315]

    if not baseline or not recent:
        return None

    current_rate = len(recent) / 15.0
    baseline_rate = len(baseline) / 300.0
    multiplier = current_rate / max(baseline_rate, 0.01)

    current_intensity = sum(e["emotion_intensity"] for e in recent) / len(recent)

    if multiplier > 3.0 and current_intensity > 0.7:
        dominant = max(set(e["primary_emotion"] for e in recent),
                       key=lambda em: sum(1 for e in recent if e["primary_emotion"] == em))
        return {
            "trigger_type": "MOMENT_CARD" if multiplier > 4 else "SPIKE_ALERT",
            "spike_multiplier": round(multiplier, 1),
            "intensity": round(current_intensity, 2),
            "dominant_emotion": dominant,
        }
    return None


# ── Background Task: Message Generator ──────────────────────────────────────

async def message_generator():
    """Simulate incoming messages at varying rates."""
    base_rate = 5  # msgs per second
    while True:
        elapsed = time.time() - match_clock["started_at"]
        # Advance match clock
        match_clock["ball"] = int(elapsed / 4) % 6 + 1
        match_clock["over"] = int(elapsed / 24) % 20 + 1

        # Simulate spikes every ~60 seconds
        cycle = math.sin(elapsed * 0.1) * 0.5 + 0.5
        burst = 1.0
        if int(elapsed) % 60 < 5:
            burst = random.uniform(3.0, 8.0)  # Wicket/six spike

        rate = base_rate * (0.5 + cycle) * burst
        msgs_this_tick = max(1, int(rate * 0.5))

        for _ in range(msgs_this_tick):
            msg = generate_message()
            msg["_ts"] = time.time()
            emotions_store.append(msg)

        # Detect spikes
        spike = detect_spike()
        if spike:
            card = {
                "card_id": uuid.uuid4().hex[:8],
                "match_id": "IND_v_PAK_2026",
                "created_at": datetime.now(timezone.utc).isoformat(),
                **spike,
            }
            moment_cards.append(card)
            await broadcast("SPIKE_ALERT", spike)

        # Broadcast emotion pulse every tick
        recent = list(emotions_store)[-50:]
        if recent:
            dist = {}
            for e in recent:
                dist[e["primary_emotion"]] = dist.get(e["primary_emotion"], 0) + 1
            total = sum(dist.values())
            dist = {k: round(v / total, 3) for k, v in dist.items()}
            avg_intensity = sum(e["emotion_intensity"] for e in recent) / len(recent)

            await broadcast("EMOTION_PULSE", {
                "global_intensity": round(avg_intensity, 3),
                "distribution": dist,
                "top_emotion": max(dist, key=dist.get),
                "over": match_clock["over"],
                "ball": match_clock["ball"],
                "message_rate": round(len(recent) / 5, 1),
            })

        await asyncio.sleep(0.5)


async def broadcast(event_type, data):
    """Broadcast to all WebSocket clients."""
    event = {"event": event_type, "event_id": f"evt_{len(event_buffer)}", "timestamp": time.time(), "data": data}
    event_buffer.append(event)
    dead = []
    for ws in connected_clients:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connected_clients.remove(ws)


@app.on_event("startup")
async def startup():
    asyncio.create_task(message_generator())
    asyncio.create_task(poll_ipl_api())


async def poll_ipl_api():
    """Poll IPL API every 30s for live match data."""
    global ipl_match
    while True:
        try:
            matches = await get_current_ipl_matches()
            if matches:
                # Pick the first live match
                live = [m for m in matches if m["match_started"] and not m["match_ended"]]
                if live:
                    ipl_match = live[0]
                    match_clock["over"] = ipl_match["current_over"]
                    match_clock["ball"] = ipl_match["current_ball"]
        except Exception:
            pass
        await asyncio.sleep(30)


# ── REST Endpoints ──────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/live-emotions")
async def live_emotions(window: str = "60s"):
    seconds = int(window.replace("s", ""))
    now = time.time()
    recent = [e for e in emotions_store if now - e["_ts"] < seconds]
    dist = {}
    for e in recent:
        dist[e["primary_emotion"]] = dist.get(e["primary_emotion"], 0) + 1
    total = sum(dist.values()) or 1
    return {
        "distribution": {k: round(v / total, 3) for k, v in dist.items()},
        "message_count": len(recent),
        "avg_intensity": round(sum(e["emotion_intensity"] for e in recent) / max(len(recent), 1), 3),
        "window": window,
    }


@app.get("/city-split")
async def city_split(top_n: int = 10):
    now = time.time()
    recent = [e for e in emotions_store if now - e["_ts"] < 300]
    city_data = {}
    for e in recent:
        c = e["city"]
        if c not in city_data:
            city_info = next((ci for ci in CITIES if ci["city"] == c), CITIES[0])
            city_data[c] = {"city": c, "state": e["state"], "lat": city_info["lat"], "lng": city_info["lng"],
                            "intensities": [], "emotions": [], "team_a": [], "team_b": []}
        city_data[c]["intensities"].append(e["emotion_intensity"])
        city_data[c]["emotions"].append(e["primary_emotion"])
        city_data[c]["team_a"].append(e["team_a_sentiment"])
        city_data[c]["team_b"].append(e["team_b_sentiment"])

    cities = []
    for c, d in city_data.items():
        n = len(d["intensities"])
        cities.append({
            "city": c, "state": d["state"], "lat": d["lat"], "lng": d["lng"],
            "message_count": n,
            "avg_intensity": round(sum(d["intensities"]) / n, 3),
            "dominant_emotion": max(set(d["emotions"]), key=d["emotions"].count),
            "team_a_sentiment": round(sum(d["team_a"]) / n, 3),
            "team_b_sentiment": round(sum(d["team_b"]) / n, 3),
        })
    cities.sort(key=lambda x: x["avg_intensity"] * math.log(x["message_count"] + 1), reverse=True)
    return {"cities": cities[:top_n]}


@app.get("/moment-cards")
async def get_moment_cards(limit: int = 20):
    return {"cards": moment_cards[-limit:], "count": len(moment_cards)}


@app.get("/match-state")
async def match_state():
    return {**match_clock, "messages_ingested": len(emotions_store),
            "moment_cards_generated": len(moment_cards), "ws_clients": len(connected_clients)}


@app.get("/ipl-match")
async def get_ipl_match():
    """Get current IPL match context."""
    return ipl_match


# ── WebSocket ───────────────────────────────────────────────────────────────

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
