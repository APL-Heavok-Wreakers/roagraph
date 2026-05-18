"""
Pydantic schemas for the emotion classification pipeline.
Defines the exact JSON structure output by the ML core.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class EmotionLabel(BaseModel):
    """Output from the Gemini emotion classifier."""
    primary: Literal[
        "joy", "euphoria", "outrage", "anxiety",
        "devastation", "disbelief", "neutral"
    ]
    secondary: Optional[str] = None
    intensity: float = Field(ge=0.0, le=1.0)


class TeamSentiment(BaseModel):
    """
    Separate sentiment per team — crucial for capturing split sentiment
    during controversial moments. NOT averaged.
    """
    team_a: float = Field(ge=-1.0, le=1.0, default=0.0)
    team_b: float = Field(ge=-1.0, le=1.0, default=0.0)


class GeoInfo(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MatchContext(BaseModel):
    over: Optional[int] = None
    ball: Optional[int] = None
    batsman_on_strike: Optional[str] = None
    innings: Optional[int] = None


class EmotionRecord(BaseModel):
    """
    The canonical output schema — one per processed message.
    This is what gets written to BigQuery.
    """
    message_id: str
    match_id: str
    source: Literal["twitter", "youtube", "whatsapp"]
    event_timestamp: datetime
    ingest_timestamp: datetime
    raw_text: str
    cleaned_text: Optional[str] = None
    language: Optional[str] = None
    primary_emotion: str
    secondary_emotion: Optional[str] = None
    emotion_intensity: float = Field(ge=0.0, le=1.0)
    team_a_sentiment: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    team_b_sentiment: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    team_affiliation: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    over_number: Optional[int] = None
    ball_number: Optional[int] = None
    batsman_on_strike: Optional[str] = None
    innings: Optional[int] = None
    processing_method: Optional[str] = None
    processing_ms: Optional[int] = None


class GeminiEmotionResponse(BaseModel):
    """Expected JSON response from the Gemini model."""
    primary: str
    secondary: Optional[str] = None
    intensity: float = Field(ge=0.0, le=1.0)
    team_affiliation: Optional[str] = None
    team_a_sentiment: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    team_b_sentiment: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
