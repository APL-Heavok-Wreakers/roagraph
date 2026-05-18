# -*- coding: utf-8 -*-
"""
IPL Live Data Integration
=========================
Fetches real-time IPL match data from CricketData.org (cricapi.com) API.

Provides:
  - Live match list + scorecard (teams, score, overs)
  - Ball-by-ball events for the current over
  - Match status narration used to drive emotion spikes

Usage:
  Set env var CRICKET_API_KEY to your free key from cricketdata.org
  Or it falls back to simulated match data.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

CRICKET_API_KEY = os.environ.get("CRICKET_API_KEY", "")
BASE_URL = "https://api.cricapi.com/v1"

# IPL 2026 team short names → full names
IPL_TEAMS = {
    "CSK": "Chennai Super Kings", "MI": "Mumbai Indians",
    "RCB": "Royal Challengers Bangalore", "KKR": "Kolkata Knight Riders",
    "DC": "Delhi Capitals", "PBKS": "Punjab Kings",
    "RR": "Rajasthan Royals", "SRH": "Sunrisers Hyderabad",
    "GT": "Gujarat Titans", "LSG": "Lucknow Super Giants",
}

# Keywords that map commentary → emotion
COMMENTARY_EMOTION_MAP = [
    # wicket events → outrage + euphoria (depends on team)
    (["wicket", "bowled", "caught", "lbw", "run out", "stumped", "dismissed"], "euphoria", 0.93),
    # boundaries → euphoria
    (["six", "sixer", "massive hit", "into the stands", "over the boundary"], "euphoria", 0.91),
    (["four", "boundary", "drives through", "races away"], "joy", 0.82),
    # near-misses → anxiety
    (["edge", "almost", "close call", "beaten", "tight", "review"], "anxiety", 0.76),
    # DRS / controversy → outrage
    (["no ball", "controversy", "umpire", "drs", "referral", "overturned"], "outrage", 0.85),
    # dot balls under pressure → tension
    (["dot ball", "pressure", "need runs", "asking rate"], "anxiety", 0.70),
]


async def get_current_ipl_matches() -> list[dict]:
    """Fetch all currently live IPL matches from CricAPI."""
    if not CRICKET_API_KEY:
        logger.warning("No CRICKET_API_KEY set — using simulated match data")
        return []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BASE_URL}/currentMatches",
                params={"apikey": CRICKET_API_KEY, "offset": 0},
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("status") != "success":
                logger.error("Cricket API error: %s", data.get("reason", "unknown"))
                return []

            # Filter for IPL matches only
            matches = []
            for match in data.get("data", []):
                name = match.get("name", "").lower()
                series = match.get("series", "").lower()
                if "ipl" in name or "ipl" in series or "indian premier league" in series:
                    matches.append(_parse_match(match))

            logger.info("Found %d live IPL matches", len(matches))
            return matches

    except Exception as e:
        logger.error("Failed to fetch cricket data: %s", e)
        return []


async def get_match_scorecard(match_id: str) -> Optional[dict]:
    """Fetch detailed scorecard for a specific match."""
    if not CRICKET_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BASE_URL}/match_info",
                params={"apikey": CRICKET_API_KEY, "id": match_id},
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("status") != "success":
                return None

            return _parse_match(data.get("data", {}))

    except Exception as e:
        logger.error("Failed to fetch scorecard for %s: %s", match_id, e)
        return None


async def get_match_commentary(match_id: str) -> list[dict]:
    """
    Fetch recent ball-by-ball commentary for a match.
    Returns a list of {ball, commentary, event_type, emotion, intensity}.
    """
    if not CRICKET_API_KEY:
        return []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BASE_URL}/match_bbb",          # ball-by-ball endpoint
                params={"apikey": CRICKET_API_KEY, "id": match_id},
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("status") != "success":
                return []

            balls = []
            for item in data.get("data", {}).get("commentary", [])[:20]:  # last 20 balls
                commentary = item.get("commentary", "").lower()
                emotion, intensity = _classify_commentary(commentary)
                balls.append({
                    "over":       item.get("over", 0),
                    "ball":       item.get("ball", 0),
                    "runs":       item.get("batsman_run", 0),
                    "commentary": item.get("commentary", ""),
                    "event_type": item.get("event", ""),
                    "emotion":    emotion,
                    "intensity":  intensity,
                })
            return balls

    except Exception as e:
        logger.error("Failed to fetch commentary for %s: %s", match_id, e)
        return []


def _classify_commentary(text: str) -> tuple[str, float]:
    """Map commentary text → (emotion, intensity) using keyword rules."""
    text_lower = text.lower()
    for keywords, emotion, intensity in COMMENTARY_EMOTION_MAP:
        if any(kw in text_lower for kw in keywords):
            return emotion, intensity
    return "neutral", 0.30


def _parse_match(raw: dict) -> dict:
    """Parse API response into our standardized match format."""
    teams = raw.get("teams", [])
    team_a = teams[0] if len(teams) > 0 else "Team A"
    team_b = teams[1] if len(teams) > 1 else "Team B"

    # Extract score info
    scores = raw.get("score", [])
    team_a_score = ""
    team_b_score = ""
    for s in scores:
        inning = s.get("inning", "")
        score_str = f"{s.get('r', 0)}/{s.get('w', 0)} ({s.get('o', 0)} ov)"
        if team_a.split()[0].lower() in inning.lower():
            team_a_score = score_str
        elif team_b.split()[0].lower() in inning.lower():
            team_b_score = score_str

    # Current over info from last innings entry
    current_over = 0.0
    if scores:
        last_score = scores[-1]
        current_over = float(last_score.get("o", 0))

    over_int = int(current_over)
    ball_int = int(round((current_over - over_int) * 10))

    return {
        "match_id":      raw.get("id", "unknown"),
        "name":          raw.get("name", ""),
        "status":        raw.get("status", ""),
        "venue":         raw.get("venue", ""),
        "date":          raw.get("date", ""),
        "match_started": raw.get("matchStarted", False),
        "match_ended":   raw.get("matchEnded", False),
        "team_a":        team_a,
        "team_b":        team_b,
        "team_a_score":  team_a_score,
        "team_b_score":  team_b_score,
        "current_over":  over_int,
        "current_ball":  ball_int,
        "teams_short": {
            "team_a": _get_short_name(team_a),
            "team_b": _get_short_name(team_b),
        },
    }


def _get_short_name(team: str) -> str:
    """Get IPL team abbreviation."""
    for short, full in IPL_TEAMS.items():
        if short.lower() in team.lower() or full.lower() in team.lower():
            return short
    return team[:3].upper()


def get_simulated_ipl_match() -> dict:
    """Fallback: return a realistic simulated IPL match."""
    return {
        "match_id":      "IPL_2026_MATCH_63",
        "name":          "Chennai Super Kings vs Sunrisers Hyderabad",
        "status":        "Sunrisers Hyderabad need 146 runs in 94 balls",
        "venue":         "MA Chidambaram Stadium, Chennai",
        "match_started": True,
        "match_ended":   False,
        "team_a":        "Chennai Super Kings",
        "team_b":        "Sunrisers Hyderabad",
        "team_a_score":  "180/7 (20.0 ov)",
        "team_b_score":  "35/1 (4.2 ov)",
        "current_over":  4,
        "current_ball":  2,
        "teams_short":   {"team_a": "CSK", "team_b": "SRH"},
    }
