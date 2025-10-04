# SkyCanvas

Draw in the sky with hand gestures and transform your sketches into stunning AI-generated images.

## Features

- 🖐️ **Hand Gesture Drawing** - Draw using pinch or point gestures
- 🎨 **AI Image Generation** - Transform sketches into photoreal images with Stable Diffusion + ControlNet
- 🖼️ **Gallery** - Save and manage your creations
- ⌨️ **Keyboard Shortcuts** - Fast navigation and actions
- 📚 **Interactive Tutorial** - Learn as you go
- ✋ **Palm to Erase** - Natural gesture controls

## Screenshots

<img width="2837" height="1589" alt="image" src="https://github.com/user-attachments/assets/3948417f-0ded-4d11-bb9a-fa6f62d82ee8" />
<img width="2843" height="1595" alt="image" src="https://github.com/user-attachments/assets/7fdd8608-543a-4764-a45e-72eaafcadffc" />
<img width="1440" height="882" alt="Screenshot 2025-10-04 at 9 14 09 PM" src="https://github.com/user-attachments/assets/ac0d519e-fe79-4e93-9d49-f5f0b5257b3e" />

## Tech Stack

**Frontend:**
- React + TypeScript + Vite
- MediaPipe Hands for gesture recognition
- Tailwind CSS

**Backend:**
- FastAPI + WebSocket
- Python asyncio

**Inference:**
- Stable Diffusion 1.5
- ControlNet (Canny edge)
- PyTorch

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10 or 3.11
- Webcam

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/SteveTM-git/skycanvas.git
cd skycanvas

Frontend Setup

bashcd frontend
npm install
npm run dev

Backend Setup

bashcd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Inference Service Setup

bashcd inference
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8001

Open the app
Visit http://localhost:5173

Usage

Click "Start Camera" to enable webcam
Show your hand - green landmarks will track it
Choose drawing mode: Pinch 🤏 or Point 👆
Make your gesture and move to draw
Click "Generate Image" to create AI art
Save to gallery and explore!

Keyboard Shortcuts

Cmd/Ctrl + Z - Undo
Cmd/Ctrl + K - Clear canvas
Cmd/Ctrl + Enter - Generate image
G - Open gallery
M - Toggle drawing mode
? - Show help


Author
STEVE THOMAS MULAMOOTTIL
