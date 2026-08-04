from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SafetyRequest(BaseModel):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    preferences: str = ""
    start_name: str = ""
    end_name: str = ""
    avoid_hazards: list[str] = Field(default_factory=list)
    alpha: float = 0.5  # 0=time priority, 1=safety priority


class HazardDetection(BaseModel):
    class_name: str
    confidence: float
    bbox: tuple[float, float, float, float]  # x1, y1, x2, y2
    severity: str = "info"
    segment_index: int = 0
    latitude: float = 0.0
    longitude: float = 0.0


class HazardInfo(BaseModel):
    type: str
    severity: str
    location: tuple[float, float]
    description: str
    confidence: float = 0.0


class IncidentInfo(BaseModel):
    title: str
    source: str
    severity: str
    date: str
    description: str
    url: str = ""


class RouteSegment(BaseModel):
    index: int
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    midpoint_lat: float
    midpoint_lon: float
    distance_m: float
    hazards: list[HazardDetection] = []
    segment_hazard_cost: float = 0.0


class RouteInfo(BaseModel):
    polyline: str = ""
    distance_m: float = 0
    duration_s: float = 0
    distance_str: str = ""
    duration_str: str = ""
    segments: list[RouteSegment] = []
    decoded_coords: list[tuple[float, float]] = []


class RouteAlternative(BaseModel):
    route_index: int = 0
    score: float = 0.0
    safety_score: float = 0.0
    rank_score: float = 0.0
    distance: str = ""
    duration: str = ""
    distance_m: float = 0.0
    duration_s: float = 0.0
    hazards: int = 0
    polyline: str = ""
    hazard_summary: dict = {}
    incidents: list[IncidentInfo] = []


class SafetyResponse(BaseModel):
    safety_score: float | None = None
    recommended_path: list[tuple[float, float]] = []
    hazards: list[HazardInfo] | None = None
    incidents: list[IncidentInfo] = []
    explanation: str = ""
    route_info: RouteInfo | None = None


class FullSafetyResponse(SafetyResponse):
    alternatives: list[RouteAlternative] | None = None
    llm_response: str = ""
    selected_route_index: int = 0
    user_preferences_parsed: dict = {}


class IncidentQuery(BaseModel):
    location: str
    radius_km: float = 5


class IncidentReport(BaseModel):
    route_id: str
    incidents: list[IncidentInfo]
    fetched_at: datetime = Field(default_factory=datetime.now)
    ttl_hours: int = 6
