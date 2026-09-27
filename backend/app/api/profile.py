from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import List, Dict, Any
from app.database import get_db
from app.models import Profile, User, Goal, Recommendation
from app.schemas import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.get("", response_model=ProfileResponse)
def get_profile(db: DBSession = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        user = db.query(User).first()
        if not user:
            user = User(email="analyst@posture-ai.internal")
            db.add(user)
            db.commit()
            db.refresh(user)
        profile = Profile(user_id=user.id, environment="Desk", primary_goal="Overall posture")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("", response_model=ProfileResponse)
def update_profile(data: ProfileUpdate, db: DBSession = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.environment is not None:
        profile.environment = data.environment
    if data.primary_goal is not None:
        profile.primary_goal = data.primary_goal
    if data.sensitivity is not None:
        profile.sensitivity = data.sensitivity
    if data.notifications_enabled is not None:
        profile.notifications_enabled = data.notifications_enabled
    if data.camera_height_cm is not None:
        profile.camera_height_cm = data.camera_height_cm

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/goals")
def get_goals(db: DBSession = Depends(get_db)) -> List[Dict[str, Any]]:
    goals = db.query(Goal).all()
    return [
        {
            "id": g.id,
            "title": g.title,
            "target_value": g.target_value,
            "current_value": g.current_value,
            "unit": g.unit,
            "streak_days": g.streak_days,
            "achieved": g.achieved
        }
        for g in goals
    ]

@router.get("/recommendations")
def get_recommendations(db: DBSession = Depends(get_db)) -> List[Dict[str, Any]]:
    recs = db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "priority": r.priority,
            "context_trigger": r.context_trigger
        }
        for r in recs
    ]
