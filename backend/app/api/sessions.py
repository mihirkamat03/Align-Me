import datetime
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Session, PostureEpisode, PostureMetric, User
from app.schemas import SessionSummary, SessionDetail, MetricPoint, EpisodeItem
from app.analysis.scoring import calculate_composite_score

router = APIRouter(tags=["Sessions"])

@router.get("", response_model=List[SessionSummary])
def list_sessions(db: DBSession = Depends(get_db)):
    sessions = db.query(Session).order_by(Session.start_time.desc()).all()
    results = []
    for s in sessions:
        ep_count = db.query(PostureEpisode).filter(PostureEpisode.session_id == s.id).count()
        primary_dev = "Balanced"
        top_ep = db.query(PostureEpisode).filter(PostureEpisode.session_id == s.id).first()
        if top_ep:
            primary_dev = top_ep.posture_type

        results.append(SessionSummary(
            id=s.id,
            title=s.title,
            start_time=s.start_time,
            end_time=s.end_time,
            duration_seconds=s.duration_seconds,
            average_score=s.average_score,
            is_demo=s.is_demo,
            episodes_count=ep_count,
            primary_deviation=primary_dev
        ))
    return results

@router.post("")
def create_session(data: Dict[str, Any] = Body(...), db: DBSession = Depends(get_db)):
    user = db.query(User).first()
    session_id = data.get("id") or f"sess-{uuid.uuid4().hex[:8]}"
    title = data.get("title", f"Posture Session {datetime.datetime.now().strftime('%b %d, %H:%M')}")
    is_demo = bool(data.get("is_demo", False))

    existing = db.query(Session).filter(Session.id == session_id).first()
    if existing:
        return {"session_id": existing.id, "title": existing.title, "start_time": existing.start_time}

    sess = Session(
        id=session_id,
        user_id=user.id if user else None,
        title=title,
        start_time=datetime.datetime.utcnow(),
        duration_seconds=0,
        average_score=100.0,
        is_demo=is_demo,
        environment_snapshot=data.get("environment", "Standard Desk")
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return {"session_id": sess.id, "title": sess.title, "start_time": sess.start_time}

@router.get("/{session_id}", response_model=SessionDetail)
def get_session_detail(session_id: str, db: DBSession = Depends(get_db)):
    sess = db.query(Session).filter(Session.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    episodes = db.query(PostureEpisode).filter(PostureEpisode.session_id == session_id).order_by(PostureEpisode.start_offset.asc()).all()
    metrics = db.query(PostureMetric).filter(PostureMetric.session_id == session_id).order_by(PostureMetric.timestamp_offset.asc()).all()

    rec_times = [ep.recovery_time_seconds for ep in episodes if ep.recovery_time_seconds and ep.recovery_time_seconds > 0]
    avg_rec = round(sum(rec_times) / len(rec_times), 1) if rec_times else 0.0

    avg_head = sum(m.head_angle for m in metrics) / len(metrics) if metrics else 12.0
    avg_sh = sum(m.shoulder_angle for m in metrics) / len(metrics) if metrics else 2.5
    avg_torso = sum(m.torso_angle for m in metrics) / len(metrics) if metrics else 6.0

    score_data = calculate_composite_score(
        avg_head_angle=avg_head,
        avg_shoulder_angle=avg_sh,
        avg_torso_angle=avg_torso,
        total_duration_sec=sess.duration_seconds,
        episodes=[{"duration_seconds": ep.duration_seconds} for ep in episodes],
        avg_recovery_sec=avg_rec
    )

    return SessionDetail(
        id=sess.id,
        title=sess.title,
        start_time=sess.start_time,
        end_time=sess.end_time,
        duration_seconds=sess.duration_seconds,
        average_score=sess.average_score,
        is_demo=sess.is_demo,
        environment_snapshot=sess.environment_snapshot or "Standard Desk",
        notes=sess.notes,
        episodes=[EpisodeItem.from_orm(ep) for ep in episodes],
        timeline=[
            MetricPoint(
                timestamp=m.timestamp_offset,
                head_angle=m.head_angle,
                shoulder_angle=m.shoulder_angle,
                torso_angle=m.torso_angle,
                stability_score=m.stability_score,
                posture_state=m.posture_state,
                confidence=m.confidence
            )
            for m in metrics
        ],
        score_breakdown=score_data,
        recovery_avg_sec=avg_rec
    )

@router.post("/{session_id}/metrics")
def add_metrics_batch(session_id: str, data: Dict[str, Any] = Body(...), db: DBSession = Depends(get_db)):
    sess = db.query(Session).filter(Session.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    metrics_list = data.get("metrics", [])
    if isinstance(data, list):
        metrics_list = data

    created_count = 0
    for m in metrics_list:
        metric_record = PostureMetric(
            session_id=session_id,
            timestamp_offset=float(m.get("timestamp", m.get("timestamp_offset", 0.0))),
            head_angle=float(m.get("head_angle", 12.0)),
            shoulder_angle=float(m.get("shoulder_angle", 2.0)),
            torso_angle=float(m.get("torso_angle", 5.0)),
            stability_score=float(m.get("stability_score", 90.0)),
            posture_state=str(m.get("posture_state", "Balanced")),
            confidence=float(m.get("confidence", 0.95))
        )
        db.add(metric_record)
        created_count += 1

    db.commit()
    return {"status": "success", "added_metrics": created_count}

@router.post("/{session_id}/events")
def add_posture_event(session_id: str, data: Dict[str, Any] = Body(...), db: DBSession = Depends(get_db)):
    sess = db.query(Session).filter(Session.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    count = db.query(PostureEpisode).filter(PostureEpisode.session_id == session_id).count()
    ep = PostureEpisode(
        session_id=session_id,
        episode_number=data.get("episode_number", count + 1),
        posture_type=data.get("posture_type", "Forward Head"),
        start_offset=float(data.get("start_offset", 0.0)),
        end_offset=float(data.get("end_offset", data.get("start_offset", 0.0) + data.get("duration_seconds", 30.0))),
        duration_seconds=float(data.get("duration_seconds", 30.0)),
        severity=data.get("severity", "Moderate"),
        recovery_time_seconds=float(data.get("recovery_time_seconds", 15.0)),
        peak_deviation_deg=float(data.get("peak_deviation_deg", 25.0))
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return {"status": "success", "episode_id": ep.id, "episode_number": ep.episode_number}

@router.delete("/{session_id}")
def delete_session(session_id: str, db: DBSession = Depends(get_db)):
    sess = db.query(Session).filter(Session.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(sess)
    db.commit()
    return {"status": "success", "deleted_session": session_id}

@router.post("/{session_id}/end")
def end_session(session_id: str, data: Dict[str, Any] = Body(default={}), db: DBSession = Depends(get_db)):
    sess = db.query(Session).filter(Session.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    sess.end_time = datetime.datetime.utcnow()
    duration = data.get("duration_seconds")
    if duration:
        sess.duration_seconds = int(duration)
    else:
        sess.duration_seconds = max(10, int((sess.end_time - sess.start_time).total_seconds()))

    metrics = db.query(PostureMetric).filter(PostureMetric.session_id == session_id).all()
    episodes = db.query(PostureEpisode).filter(PostureEpisode.session_id == session_id).all()

    avg_head = sum(m.head_angle for m in metrics) / len(metrics) if metrics else 12.0
    avg_sh = sum(m.shoulder_angle for m in metrics) / len(metrics) if metrics else 2.5
    avg_torso = sum(m.torso_angle for m in metrics) / len(metrics) if metrics else 6.0
    rec_times = [ep.recovery_time_seconds for ep in episodes if ep.recovery_time_seconds and ep.recovery_time_seconds > 0]
    avg_rec = round(sum(rec_times) / len(rec_times), 1) if rec_times else 0.0

    score_result = calculate_composite_score(
        avg_head_angle=avg_head,
        avg_shoulder_angle=avg_sh,
        avg_torso_angle=avg_torso,
        total_duration_sec=sess.duration_seconds,
        episodes=[{"duration_seconds": ep.duration_seconds} for ep in episodes],
        avg_recovery_sec=avg_rec
    )
    sess.average_score = score_result["final_score"]
    sess.notes = data.get("notes", "Session successfully completed.")

    db.commit()
    db.refresh(sess)

    return {
        "session_id": sess.id,
        "duration_seconds": sess.duration_seconds,
        "average_score": sess.average_score,
        "breakdown": score_result
    }
