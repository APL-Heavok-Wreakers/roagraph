"""
IPL Live Data Integration
=========================
Fetches real-time IPL match data from CricketData.org API.
Provides live match context (overs, scores, batsmen, teams) to the
emotion simulation engine so the dashboard shows real match info.

Usage:
  Set env var CRICKET_API_KEY to your free key from cricketdata.org
  Or it falls back to simulated match data.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx

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


async def get_current_ipl_matches() -> list[dict]:
    """Fetch all currently live IPL matches."""
    if not CRICKET_API_KEY:
        logger.warning("No CRICKET_API_KEY set — using simulated match data")
        return []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BASE_URL}/currentMatches",
                params={"apikey": CRICKET_API_KEY, "offset": 0},
            )
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
            data = resp.json()

            if data.get("status") != "success":
                return None

            return _parse_match(data.get("data", {}))

    except Exception as e:
        logger.error("Failed to fetch scorecard: %s", e)
        return None


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
        if team_a.split()[0] in inning:
            team_a_score = score_str
        elif team_b.split()[0] in inning:
            team_b_score = score_str

    # Current batting info
    current_over = 0.0
    if scores:
        last_score = scores[-1]
        current_over = last_score.get("o", 0)

    over_int = int(current_over)
    ball_int = int(round((current_over - over_int) * 10))

    return {
        "match_id": raw.get("id", "unknown"),
        "name": raw.get("name", ""),
        "status": raw.get("status", ""),
        "venue": raw.get("venue", ""),
        "date": raw.get("date", ""),
        "match_started": raw.get("matchStarted", False),
        "match_ended": raw.get("matchEnded", False),
        "team_a": team_a,
        "team_b": team_b,
        "team_a_score": team_a_score,
        "team_b_score": team_b_score,
        "current_over": over_int,
        "current_ball": ball_int,
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
    # Fallback: first 3 chars
    return team[:3].upper()


def get_simulated_ipl_match() -> dict:
    """Fallback: return a realistic simulated IPL match."""
    return {
        "match_id": "IPL_2026_SIMULATED",
        "name": "Mumbai Indians vs Chennai Super Kings",
        "status": "Mumbai Indians need 42 runs in 24 balls",
        "venue": "Wankhede Stadium, Mumbai",
        "match_started": True,
        "match_ended": False,
        "team_a": "Mumbai Indians",
        "team_b": "Chennai Super Kings",
        "team_a_score": "158/4 (16.0 ov)",
        "team_b_score": "199/6 (20.0 ov)",
        "current_over": 16,
        "current_ball": 0,
        "teams_short": {"team_a": "MI", "team_b": "CSK"},
    }
