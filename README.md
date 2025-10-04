# SkyCanvas

Draw in the sky with hand gestures and transform your sketches into stunning AI-generated images.

## Features

- 🖐️ **Hand Gesture Drawing** - Draw using pinch or point gestures
- 🎨 **AI Image Generation** - Transform sketches into photoreal images with Stable Diffusion + ControlNet
- 🖼️ **Gallery** - Save and manage your creations
- ⌨️ **Keyboard Shortcuts** - Fast navigation and actions
- 📚 **Interactive Tutorial** - Learn as you go
- ✋ **Palm to Erase** - Natural gesture controls

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
git clone https://github.com/YOUR_USERNAME/skycanvas.git
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

License
MIT
Author
Your Name
