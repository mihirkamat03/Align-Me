from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Session, PostureEpisode, PostureMetric, DailySummary, Goal, Recommendation, Profile, User
from app.services.seed_data import seed_database

router = APIRouter(prefix="/api/demo", tags=["Demo"])

@router.post("/seed")
def reset_and_seed_demo_data(db: DBSession = Depends(get_db)):
    """
    Resets and populates the database with realistic demo sessions, episodes, and metrics.
    """
    db.query(PostureMetric).delete()
    db.query(PostureEpisode).delete()
    db.query(Session).delete()
    db.query(DailySummary).delete()
    db.query(Goal).delete()
    db.query(Recommendation).delete()
    db.query(Profile).delete()
    db.query(User).delete()
    db.commit()

    seed_database(db)

    return {
        "status": "success",
        "message": "Demo environment successfully seeded with realistic multi-session posture telemetry and episodes."
    }
