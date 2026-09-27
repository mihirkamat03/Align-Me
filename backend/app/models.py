import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, default="analyst@posture-ai.internal")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False)
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    environment = Column(String, default="Desk")  # Desk, Study table, Gaming setup, Standing desk, Other
    primary_goal = Column(String, default="Overall posture")  # Neck posture, Shoulder alignment, Sitting posture, Overall posture, Long-session habits
    sensitivity = Column(Float, default=1.0)
    notifications_enabled = Column(Boolean, default=True)
    camera_height_cm = Column(Float, default=75.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)  # UUID or human-readable ID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, default="Posture Assessment")
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    average_score = Column(Float, default=85.0)
    is_demo = Column(Boolean, default=False)
    environment_snapshot = Column(String, default="Standard Desk")
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="sessions")
    metrics = relationship("PostureMetric", back_populates="session", cascade="all, delete-orphan")
    episodes = relationship("PostureEpisode", back_populates="session", cascade="all, delete-orphan")

class PostureMetric(Base):
    __tablename__ = "posture_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    timestamp_offset = Column(Float, index=True)  # seconds from session start
    head_angle = Column(Float)
    shoulder_angle = Column(Float)
    torso_angle = Column(Float)
    stability_score = Column(Float)
    posture_state = Column(String)  # Balanced, Forward Lean, Forward Head, Shoulder Asymmetry, Persistent Slouch
    confidence = Column(Float, default=0.95)

    session = relationship("Session", back_populates="metrics")

class PostureEpisode(Base):
    __tablename__ = "posture_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    episode_number = Column(Integer)
    posture_type = Column(String)  # Forward Lean, Forward Head, Shoulder Asymmetry, Persistent Slouch
    start_offset = Column(Float)
    end_offset = Column(Float)
    duration_seconds = Column(Float)
    severity = Column(String)  # Mild, Moderate, Severe
    recovery_time_seconds = Column(Float)
    peak_deviation_deg = Column(Float, default=0.0)

    session = relationship("Session", back_populates="episodes")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String)
    target_value = Column(Float)
    current_value = Column(Float)
    unit = Column(String)
    streak_days = Column(Integer, default=0)
    achieved = Column(Boolean, default=False)

    user = relationship("User", back_populates="goals")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String)
    description = Column(Text)
    category = Column(String)  # Ergonomic, Habit, Reset, Calibration
    priority = Column(String, default="medium")  # high, medium, low
    context_trigger = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="recommendations")

class DailySummary(Base):
    __tablename__ = "daily_summaries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, index=True)  # YYYY-MM-DD
    avg_score = Column(Float)
    total_tracked_minutes = Column(Integer)
    episodes_count = Column(Integer)
    primary_issue = Column(String)
    recovery_avg_sec = Column(Float)
