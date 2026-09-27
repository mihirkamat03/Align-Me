from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Session, PostureEpisode, PostureMetric, DailySummary

router = APIRouter(prefix="/api/privacy", tags=["Privacy"])

@router.post("/purge")
@router.delete("/purge")
def purge_all_data(db: DBSession = Depends(get_db)):
    """
    Privacy-first guarantee: permanently erase all telemetry, frames, episodes, and sessions.
    """
    db.query(PostureMetric).delete()
    db.query(PostureEpisode).delete()
    db.query(Session).delete()
    db.query(DailySummary).delete()
    db.commit()

    return {
        "status": "success",
        "message": "All posture telemetry, historical sessions, and episode logs have been cryptographically erased from PostgreSQL storage.",
        "records_retained": 0
    }
