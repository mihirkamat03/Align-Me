from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class ProfileBase(BaseModel):
    environment: str = "Desk"
    primary_goal: str = "Overall posture"
    sensitivity: float = 1.0
    notifications_enabled: bool = True
    camera_height_cm: float = 75.0

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    environment: Optional[str] = None
    primary_goal: Optional[str] = None
    sensitivity: Optional[float] = None
    notifications_enabled: Optional[bool] = None
    camera_height_cm: Optional[float] = None

class MetricPoint(BaseModel):
    timestamp: float
    head_angle: float
    shoulder_angle: float
    torso_angle: float
    stability_score: float
    posture_state: str
    confidence: float = 0.95

class LiveFrameInput(BaseModel):
    session_id: str
    timestamp: float
    head_angle: float
    shoulder_angle: float
    torso_angle: float
    confidence: float = 0.95
    landmarks: Optional[Dict[str, Any]] = None

class EpisodeItem(BaseModel):
    episode_number: int
    posture_type: str
    start_offset: float
    end_offset: float
    duration_seconds: float
    severity: str
    recovery_time_seconds: float
    peak_deviation_deg: float

    class Config:
        from_attributes = True

class SessionSummary(BaseModel):
    id: str
    title: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int
    average_score: float
    is_demo: bool
    episodes_count: int
    primary_deviation: Optional[str] = None

    class Config:
        from_attributes = True

class SessionDetail(BaseModel):
    id: str
    title: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int
    average_score: float
    is_demo: bool
    environment_snapshot: str
    notes: Optional[str] = None
    episodes: List[EpisodeItem] = []
    timeline: List[MetricPoint] = []
    score_breakdown: Dict[str, Any] = {}
    recovery_avg_sec: float = 0.0

    class Config:
        from_attributes = True

class DashboardAnalytics(BaseModel):
    today_score: float
    score_change_delta: float
    today_pattern_headline: str
    today_pattern_description: str
    total_tracked_today_min: int
    episodes_today_count: int
    stability_avg_pct: float
    avg_recovery_sec: float
    body_heatmap: Dict[str, Any]
    timeline_sample: List[MetricPoint]
    recent_episodes: List[EpisodeItem]
    goals: List[Dict[str, Any]]
    insights: List[Dict[str, Any]]

class LongitudinalProfile(BaseModel):
    most_common_pattern: str
    vulnerable_period: str
    average_recovery_sec: float
    best_period: str
    unstable_period: str
    posture_endurance_min: int
    total_sessions_analyzed: int
    weekly_recovery_trend: List[Dict[str, Any]]
    category_distribution: Dict[str, float]
    ergonomic_observations: List[Dict[str, Any]]
