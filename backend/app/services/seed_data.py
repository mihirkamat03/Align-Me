import datetime
import math
import random
from sqlalchemy.orm import Session as DBSession
from app.models import User, Profile, Session, PostureMetric, PostureEpisode, Goal, Recommendation, DailySummary

def seed_database(db: DBSession):
    """
    Seeds rich, realistic posture sessions, episodes, metrics, goals, and profile.
    """
    # Check if already seeded
    existing_user = db.query(User).first()
    if existing_user:
        return existing_user

    # 1. User & Profile
    user = User(id=1, email="alex.chen@healthcv.internal")
    db.add(user)
    db.flush()

    profile = Profile(
        id=1,
        user_id=user.id,
        environment="Desk",
        primary_goal="Neck posture & Long-session habits",
        sensitivity=1.0,
        notifications_enabled=True,
        camera_height_cm=78.0
    )
    db.add(profile)

    # 2. Goals
    goals_data = [
        {"title": "Consistent Daily Tracking", "target_value": 7.0, "current_value": 5.0, "unit": "days", "streak_days": 5, "achieved": False},
        {"title": "Average Recovery Speed", "target_value": 15.0, "current_value": 14.8, "unit": "sec", "streak_days": 3, "achieved": True},
        {"title": "Session Stability Score > 85", "target_value": 85.0, "current_value": 88.4, "unit": "pts", "streak_days": 4, "achieved": True},
        {"title": "Zero Persistent Slouch Episodes", "target_value": 1.0, "current_value": 1.0, "unit": "target", "streak_days": 2, "achieved": True}
    ]
    for g in goals_data:
        db.add(Goal(user_id=user.id, **g))

    # 3. Recommendations
    recs = [
        {
            "user_id": user.id,
            "title": "Proactive 35-Minute Cervical Reset",
            "description": "Telemetry indicates forward-head deviation begins manifesting at minute 37. Take a 30-second sternal elevation pause at minute 35.",
            "category": "Habit",
            "priority": "high",
            "context_trigger": "Long-session fatigue"
        },
        {
            "user_id": user.id,
            "title": "Camera Angle Micro-Adjustment",
            "description": "Raise your webcam by 4–6 cm or tilt your laptop screen backwards slightly to bring the optical lens directly level with eye height.",
            "category": "Ergonomic",
            "priority": "medium",
            "context_trigger": "Initial calibration tilt"
        },
        {
            "user_id": user.id,
            "title": "Scapular Retraction Drill",
            "description": "Perform 3 sets of gentle shoulder blade retractions to reinforce mid-back stability after prolonged typing intervals.",
            "category": "Reset",
            "priority": "low",
            "context_trigger": "Shoulder asymmetry episode"
        }
    ]
    for r in recs:
        db.add(Recommendation(**r))

    # 4. Daily Summaries
    today = datetime.date.today()
    for i in range(7):
        day_date = today - datetime.timedelta(days=6 - i)
        date_str = day_date.strftime("%Y-%m-%d")
        score = round(74.0 + (i * 2.3) + random.uniform(-1.5, 2.0), 1)
        db.add(DailySummary(
            date=date_str,
            avg_score=min(94.0, score),
            total_tracked_minutes=45 + (i * 5),
            episodes_count=max(1, 6 - int(i * 0.7)),
            primary_issue="Forward Head" if i % 2 == 0 else "Forward Lean",
            recovery_avg_sec=round(22.0 - (i * 1.1), 1)
        ))

    # 5. Sessions (Past 3 sessions + Today's flagship session)
    sessions_seed = [
        {
            "id": "session-live-demo-01",
            "title": "Deep Focus Workblock (Flagship Demo)",
            "start_time": datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            "end_time": datetime.datetime.utcnow() - datetime.timedelta(hours=1, minutes=10),
            "duration_seconds": 3000, # 50 mins
            "average_score": 87.5,
            "is_demo": True,
            "environment_snapshot": "Adjusted Standing/Sitting Desk",
            "notes": "Optimal stability during initial 35m. Mild cervical fatigue noticed in the final 12m."
        },
        {
            "id": "session-hist-02",
            "title": "Afternoon Coding Session",
            "start_time": datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=3),
            "end_time": datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=2),
            "duration_seconds": 3600, # 60 mins
            "average_score": 82.0,
            "is_demo": False,
            "environment_snapshot": "Dual Monitor Desk",
            "notes": "Noticed shoulder asymmetry when working primarily on right monitor."
        },
        {
            "id": "session-hist-03",
            "title": "Morning Design Review",
            "start_time": datetime.datetime.utcnow() - datetime.timedelta(days=2, hours=4),
            "end_time": datetime.datetime.utcnow() - datetime.timedelta(days=2, hours=3, minutes=15),
            "duration_seconds": 2700, # 45 mins
            "average_score": 89.2,
            "is_demo": False,
            "environment_snapshot": "Standard Desk",
            "notes": "Excellent head alignment; rapid recovery from minor movements."
        }
    ]

    for s_info in sessions_seed:
        sess = Session(user_id=user.id, **s_info)
        db.add(sess)
        db.flush()

        # Seed episodes for flagship session
        if sess.id == "session-live-demo-01":
            episodes_data = [
                {
                    "episode_number": 1,
                    "posture_type": "Forward Lean",
                    "start_offset": 840.0, # 14:00
                    "end_offset": 990.0,   # 16:30
                    "duration_seconds": 150.0,
                    "severity": "Mild",
                    "recovery_time_seconds": 14.2,
                    "peak_deviation_deg": 19.4
                },
                {
                    "episode_number": 2,
                    "posture_type": "Shoulder Asymmetry",
                    "start_offset": 1680.0, # 28:00
                    "end_offset": 1845.0,  # 30:45
                    "duration_seconds": 165.0,
                    "severity": "Moderate",
                    "recovery_time_seconds": 16.8,
                    "peak_deviation_deg": 9.2
                },
                {
                    "episode_number": 3,
                    "posture_type": "Forward Head",
                    "start_offset": 2340.0, # 39:00
                    "end_offset": 2580.0,  # 43:00
                    "duration_seconds": 240.0,
                    "severity": "Moderate",
                    "recovery_time_seconds": 15.0,
                    "peak_deviation_deg": 28.5
                }
            ]
            for ep in episodes_data:
                db.add(PostureEpisode(session_id=sess.id, **ep))

            # Sample timeline metrics (every 20s for smooth 3D replay & timeline visualization)
            duration = sess.duration_seconds
            t = 0.0
            while t <= duration:
                # Base healthy posture
                h_angle = 11.5 + random.uniform(-1.5, 1.5)
                s_angle = 2.2 + random.uniform(-0.8, 0.8)
                t_angle = 5.0 + random.uniform(-1.0, 1.0)
                state = "Balanced"

                # Simulate episodes in metrics
                if 840.0 <= t <= 990.0:
                    t_angle = 17.5 + random.uniform(-1.0, 2.0)
                    state = "Forward Lean"
                elif 1680.0 <= t <= 1845.0:
                    s_angle = 8.8 + random.uniform(-0.5, 1.2)
                    state = "Shoulder Asymmetry"
                elif 2340.0 <= t <= 2580.0:
                    h_angle = 27.2 + random.uniform(-1.5, 2.5)
                    state = "Forward Head"
                elif t > 2600.0:
                    # Slight fatigue towards the end
                    h_angle += 3.5
                    t_angle += 2.0

                head_pen = max(0.0, (h_angle - 12.0) * 2.0)
                sh_pen = max(0.0, (s_angle - 3.0) * 3.0)
                torso_pen = max(0.0, (t_angle - 6.0) * 2.0)
                stability = max(40.0, min(100.0, round(100.0 - (head_pen + sh_pen + torso_pen), 1)))

                db.add(PostureMetric(
                    session_id=sess.id,
                    timestamp_offset=round(t, 1),
                    head_angle=round(h_angle, 1),
                    shoulder_angle=round(s_angle, 1),
                    torso_angle=round(t_angle, 1),
                    stability_score=stability,
                    posture_state=state,
                    confidence=0.96
                ))
                t += 20.0

    db.commit()
    return user
