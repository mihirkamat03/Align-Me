import urllib.request
import json
import asyncio
import websockets

def test_rest():
    base = "http://localhost:8000"
    
    # 1. Health
    res = urllib.request.urlopen(f"{base}/api/health")
    assert res.getcode() == 200, "Health check failed"
    data = json.loads(res.read().decode())
    print("[PASS] GET /api/health passed:", data["status"])

    # 2. Dashboard
    res = urllib.request.urlopen(f"{base}/api/dashboard")
    assert res.getcode() == 200, "Dashboard endpoint failed"
    data = json.loads(res.read().decode())
    print("[PASS] GET /api/dashboard passed. Today's score:", data["today_score"], "| Headline:", data["today_pattern_headline"])

    # 3. Sessions
    res = urllib.request.urlopen(f"{base}/api/sessions")
    assert res.getcode() == 200, "Sessions endpoint failed"
    sessions = json.loads(res.read().decode())
    print("[PASS] GET /api/sessions passed. Total sessions:", len(sessions))

    # 4. Session detail & replay
    res = urllib.request.urlopen(f"{base}/api/sessions/session-live-demo-01")
    assert res.getcode() == 200, "Session detail failed"
    detail = json.loads(res.read().decode())
    print("[PASS] GET /api/sessions/{id} passed. Episodes count:", len(detail["episodes"]), "| Timeline frames:", len(detail["timeline"]))

    # 5. Profile
    res = urllib.request.urlopen(f"{base}/api/analytics/profile")
    assert res.getcode() == 200, "Profile analytics failed"
    prof = json.loads(res.read().decode())
    print("[PASS] GET /api/analytics/profile passed. Dominant pattern:", prof["most_common_pattern"], "| Recovery agility:", prof["average_recovery_sec"])

    # 6. Frontend
    res = urllib.request.urlopen("http://localhost:5173")
    assert res.getcode() == 200, "Frontend server failed"
    print("[PASS] GET http://localhost:5173 passed (Status 200 OK)")

async def test_ws():
    uri = "ws://localhost:8000/ws/posture/session-e2e-ws-test"
    async with websockets.connect(uri) as ws:
        payload = {
            "timestamp": 1.2,
            "head_angle": 13.5,
            "shoulder_angle": 1.9,
            "torso_angle": 5.4,
            "confidence": 0.98
        }
        await ws.send(json.dumps(payload))
        response = await ws.recv()
        data = json.loads(response)
        assert data["type"] == "telemetry_update", "Invalid WS response"
        p = data["payload"]
        print("[PASS] WebSocket /ws/posture/{id} passed. Smoothed head angle:", p["head_angle"], "| State:", p["posture_state"])

if __name__ == "__main__":
    print("--- Starting Aether End-to-End Suite ---")
    test_rest()
    asyncio.run(test_ws())
    print("--- ALL SYSTEMS OPERATIONAL & VERIFIED ---")
