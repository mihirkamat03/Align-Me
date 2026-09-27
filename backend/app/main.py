import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.api import profile, sessions, analytics, privacy, demo, posture
from app.websocket.manager import ws_manager
from app.services.seed_data import seed_database

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Aether Posture Intelligence Platform API",
    description="Clinical-grade computer vision posture telemetry, temporal episode analysis, and longitudinal health analytics.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(profile.router)
app.include_router(sessions.router, prefix="/api/sessions")
app.include_router(sessions.router, prefix="/api/session")
app.include_router(analytics.router)
app.include_router(posture.router)
app.include_router(privacy.router)
app.include_router(demo.router)

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Posture Intelligence Platform",
        "version": "1.0.0",
        "cv_pipeline": "Active (Local Edge Stream + Server Hysteresis Engine)"
    }

@app.websocket("/ws/posture/{session_id}")
async def websocket_posture_endpoint(websocket: WebSocket, session_id: str):
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)
            await ws_manager.process_frame_data(session_id, data)
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id)
    except Exception:
        ws_manager.disconnect(session_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
