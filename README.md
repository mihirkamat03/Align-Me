# Align Me 🪑✨

> **Intelligent, real-time ergonomic posture tracking & biomechanics analytics powered by Computer Vision.**

Align Me transforms your webcam into an advanced ergonomic monitoring studio. Using real-time pose estimation, geometric kinematic modeling, and ergonomic posture analysis, Align Me detects slumping, forward head tilt, lateral spinal deviations, and asymmetric shoulder drop — guiding you to healthier sitting habits with immediate tactile feedback.

---

## 🚀 Key Features

- **Real-Time Pose Biomechanics**: Evaluates cervical spine angle, trunk lean, shoulder alignment, and forward head displacement in real time via MediaPipe Pose / browser Vision API.
- **Interactive 3D Spine Kinematics**: Dynamic 3D spinal visualization reflecting real-time vertebral curvature, stress load, and thoracic alignment.
- **Privacy-First Architecture**: Video feeds are processed locally on the client edge. No raw camera images or video frames are ever recorded or transmitted to the cloud.
- **Comprehensive Session Analytics**: Session duration, stability index, time spent in optimal posture, slouch frequency, and posture timeline heatmaps.
- **Guided Desk Ergonomics & Stretches**: Interactive micro-break routines, neck stretches, and thoracic spine mobility exercises.
- **Tactile 3D Glassmorphic UI**: Cursor-reactive ambient backdrops, 3D elevated component architecture, and high-clarity ergonomic dashboards.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Custom 3D CSS elevation system
- **Icons**: Lucide React
- **Graphics & Visualizations**: HTML5 Canvas, SVG Biomechanics gauges, Three.js
- **State & Networking**: React Context API, WebSockets, Axios

### Backend & Database
- **Framework**: Python FastAPI
- **Real-Time**: WebSockets for low-latency metric streaming
- **Database**: PostgreSQL 18 with SQLAlchemy 2.0 ORM & Pydantic v2
- **Analytics & Geometry**: Vector geometry, temporal slouch filtering, and biomechanical posture scoring algorithms

---

## 🏃 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL 18

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start using Align Me.

---

## 🔒 Privacy & Security

Align Me is built with privacy at its core:
1. **Local Frame Processing**: Camera frames are processed on-device.
2. **Coordinate Telemetry Only**: Only numerical skeletal landmark coordinates (x, y, z, visibility) are utilized for metric calculation.
3. **No Storage of Video**: Video streams are never saved, streamed to external servers, or stored to disk.

---

## 📄 License
MIT License.
