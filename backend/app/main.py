from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
import logging
from datetime import datetime
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

generations_storage = []


app = FastAPI(
    title="AirSketch API",
    description="Real-time hand gesture drawing and AI image generation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {
        "message": "AirSketch API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "connections": len(manager.active_connections)
    }

@app.websocket("/ws/draw")
async def websocket_draw_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                draw_data = json.loads(data)
                logger.info(f"Received: {draw_data.get('type', 'unknown')}")
                await manager.send_personal_message(
                    json.dumps({
                        "type": "draw_ack",
                        "timestamp": draw_data.get("timestamp"),
                        "status": "received"
                    }),
                    websocket
                )
            except json.JSONDecodeError:
                logger.error("Invalid JSON")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        manager.disconnect(websocket)

@app.post("/api/generate")
async def generate_image(request: dict):
    return {
        "status": "pending",
        "message": "Inference service coming next",
        "job_id": "mock-123"
    }
@app.post("/api/generations")
async def save_generation(data: dict):
    """Save a generated image to user's gallery"""
    generation = {
        "id": str(uuid.uuid4()),
        "user_id": data.get("user_id", "guest"),
        "sketch_data": data.get("sketch_data"),
        "image_data": data.get("image_data"),
        "prompt": data.get("prompt"),
        "created_at": datetime.now().isoformat()
    }
    generations_storage.append(generation)
    logger.info(f"Saved generation: {generation['id']}")
    return {"status": "success", "id": generation["id"]}

@app.get("/api/generations")
async def get_generations(user_id: str = "guest"):
    """Get user's generation history"""
    user_generations = [g for g in generations_storage if g["user_id"] == user_id]
    return {
        "generations": user_generations,
        "count": len(user_generations)
    }

@app.delete("/api/generations/{generation_id}")
async def delete_generation(generation_id: str):
    """Delete a generation"""
    global generations_storage
    generations_storage = [g for g in generations_storage if g["id"] != generation_id]
    return {"status": "deleted"}
@app.post("/api/gallery")
async def save_to_gallery(data: dict):
    """Save a generated image to gallery"""
    item = {
        "id": str(uuid.uuid4()),
        "sketch_data": data.get("sketch_data"),
        "image_data": data.get("image_data"),
        "prompt": data.get("prompt"),
        "created_at": datetime.now().isoformat()
    }
    gallery_storage.append(item)
    logger.info(f"Saved to gallery: {item['id']}")
    return {"status": "success", "id": item["id"]}

@app.get("/api/gallery")
async def get_gallery():
    """Get all gallery items"""
    return {
        "items": sorted(gallery_storage, key=lambda x: x["created_at"], reverse=True),
        "count": len(gallery_storage)
    }

@app.delete("/api/gallery/{item_id}")
async def delete_from_gallery(item_id: str):
    """Delete an item from gallery"""
    global gallery_storage
    gallery_storage = [item for item in gallery_storage if item["id"] != item_id]
    logger.info(f"Deleted from gallery: {item_id}")
    return {"status": "deleted"}