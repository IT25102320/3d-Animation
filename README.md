# Real-Time Motion Capture (MoCap) Desktop Application

## Project Vision
A commercial-grade, real-time motion capture desktop application that translates human movements from a live webcam or uploaded video into a 3D character. The application features a highly polished, dark-themed UI with smooth transitions and modern glowing accents, built as a desktop application.

## Strict "Zero-Error" Policy
The core of the business logic requires that **any 3D humanoid model** (.obj, .fbx, .gltf) uploaded by the user must process without error. If a model lacks an armature/skeleton, the system will seamlessly intercept the model, apply a programmatic auto-rigging algorithm, bind the mesh to the new bones, and return the rigged model to the frontend, displaying only a "Processing Model..." state.

## System Architecture

### Tech Stack
*   **Frontend Container:** Tauri or Electron
*   **Frontend Framework:** React (Vite)
*   **Styling & UI:** Tailwind CSS, Framer Motion
*   **3D Engine:** Three.js, React Three Fiber (R3F), Drei
*   **Motion Tracking:** Google MediaPipe Pose (running in WebWorkers)
*   **Backend / Auto-Rigging:** Python, FastAPI
*   **Animation Logic:** Inverse Kinematics (IK), Quaternion Interpolation (Slerp)

### Architecture Tree
```text
mocap-app/
├── frontend/               # Vite + React + Tailwind App
│   ├── src/
│   │   ├── components/     # UI Components (Dashboard, Canvas, Video Controls)
│   │   ├── hooks/          # React hooks for state, WebWorker management
│   │   ├── workers/        # WebWorkers for MediaPipe Pose processing to prevent UI blocking
│   │   ├── 3d/             # R3F Components, IK solvers, Slerp logic, Character Controllers
│   │   ├── styles/         # Tailwind, global CSS (Dark theme, glow effects)
│   │   └── utils/          # Math utils, coordinate mapping logic
│   ├── public/             # Default models, static assets
│   └── package.json
├── backend/                # Python + FastAPI Processing Engine
│   ├── api/                # REST endpoints
│   ├── core/               # Model parsers (.obj, .fbx, .gltf)
│   ├── auto_rig/           # Auto-rigging pipeline (Zero-Error Fallback System)
│   │   ├── skeleton_gen.py # Bounding-box/heuristic skeleton generation
│   │   └── skin_bind.py    # Automatic bone weight assignment
│   └── requirements.txt
├── desktop/                # Tauri/Electron wrappers & configurations
└── README.md
```

## Phased Execution Plan

*   **Phase 1: Environment & UI Foundation**
    *   Set up Vite+React+Tailwind project.
    *   Build premium dark-themed dashboard UI.
    *   Create placeholders for Video/Webcam feed and 3D Canvas.
*   **Phase 2: Pose Tracking Engine**
    *   Integrate Google MediaPipe via WebWorkers.
    *   Implement webcam access and video upload support.
    *   Draw futuristic 2D skeleton overlay on the video feed.
*   **Phase 3: 3D Engine & Retargeting**
    *   Set up React Three Fiber canvas.
    *   Load default rigged 3D character.
    *   Map MediaPipe coordinates to 3D model bones using IK and Slerp.
*   **Phase 4: The Auto-Rigging Pipeline**
    *   Implement Python FastAPI backend.
    *   Create auto-rigging logic for unrigged 3D models to ensure the Zero-Error policy.

## Running the Application Locally

To test out the Real-Time MoCap Engine natively on your desktop, you will need to start both the Python backend and the Tauri frontend app.

### 1. Start the Zero-Error Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend API will run on `http://127.0.0.1:8000`.

### 2. Start the Frontend Desktop Application (Tauri + Vite)

In a new terminal window:

```bash
cd frontend
npm install
npm run tauri dev
```

This will automatically start the Vite dev server and launch the native desktop application.
