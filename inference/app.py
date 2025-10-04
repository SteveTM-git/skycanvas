from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
from PIL import Image
import base64
import io
import cv2
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AirSketch Inference Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline (lazy loaded)
pipeline = None
device = "cuda" if torch.cuda.is_available() else "cpu"

class GenerateRequest(BaseModel):
    sketch_base64: str
    prompt: str = "a beautiful photograph"
    negative_prompt: str = "ugly, blurry, low quality"
    num_inference_steps: int = 20
    guidance_scale: float = 7.5
    controlnet_conditioning_scale: float = 1.0

class GenerateResponse(BaseModel):
    image_base64: str
    metadata: dict

def preprocess_sketch(sketch_img: Image.Image) -> Image.Image:
    """
    Preprocess sketch for ControlNet (edge detection)
    """
    # Convert to grayscale
    img_array = np.array(sketch_img.convert('L'))
    
    # Apply Canny edge detection
    edges = cv2.Canny(img_array, 100, 200)
    
    # Invert (ControlNet expects white edges on black background)
    edges = 255 - edges
    
    # Convert back to PIL and resize to 512x512 for SD
    edge_img = Image.fromarray(edges).convert('RGB')
    edge_img = edge_img.resize((512, 512), Image.Resampling.LANCZOS)
    
    return edge_img

def load_pipeline():
    """
    Load Stable Diffusion + ControlNet pipeline
    """
    global pipeline
    
    if pipeline is not None:
        return pipeline
    
    logger.info(f"Loading pipeline on device: {device}")
    logger.info("This may take 2-5 minutes on first run (downloading ~4GB model)...")
    
    try:
        # Load ControlNet model (Canny edge)
        controlnet = ControlNetModel.from_pretrained(
            "lllyasviel/sd-controlnet-canny",
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        
        # Load Stable Diffusion pipeline with ControlNet
        pipeline = StableDiffusionControlNetPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            controlnet=controlnet,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            safety_checker=None
        )
        
        pipeline = pipeline.to(device)
        
        # Enable memory optimizations
        if device == "cuda":
            pipeline.enable_attention_slicing()
            pipeline.enable_vae_slicing()
        else:
            # CPU optimizations
            logger.info("Running on CPU - generation will be slower (~2-3 minutes)")
        
        logger.info("Pipeline loaded successfully!")
        return pipeline
        
    except Exception as e:
        logger.error(f"Failed to load pipeline: {str(e)}")
        raise

@app.on_event("startup")
async def startup_event():
    """
    Optionally preload model on startup
    """
    logger.info("Inference service starting...")
    logger.info(f"Device: {device}")

@app.get("/")
async def root():
    return {
        "service": "AirSketch Inference",
        "device": device,
        "status": "ready"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "device": device,
        "model_loaded": pipeline is not None
    }

@app.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """
    Generate photoreal image from sketch
    """
    try:
        # Decode base64 sketch
        sketch_data = base64.b64decode(
            request.sketch_base64.split(',')[1] if ',' in request.sketch_base64 
            else request.sketch_base64
        )
        sketch_img = Image.open(io.BytesIO(sketch_data))
        
        logger.info(f"Received sketch: {sketch_img.size}")
        
        # Preprocess sketch
        logger.info("Preprocessing sketch with Canny edge detection...")
        control_image = preprocess_sketch(sketch_img)
        
        # Load pipeline if not loaded
        logger.info("Loading AI model (first time may take 2-5 minutes)...")
        pipe = load_pipeline()
        
        # Generate image
        logger.info(f"Generating image with prompt: '{request.prompt}'")
        logger.info(f"Steps: {request.num_inference_steps}, Device: {device}")
        
        if device == "cuda":
            with torch.autocast(device):
                result = pipe(
                    prompt=request.prompt,
                    negative_prompt=request.negative_prompt,
                    image=control_image,
                    num_inference_steps=request.num_inference_steps,
                    guidance_scale=request.guidance_scale,
                    controlnet_conditioning_scale=request.controlnet_conditioning_scale
                )
        else:
            # CPU mode
            result = pipe(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                image=control_image,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=request.guidance_scale,
                controlnet_conditioning_scale=request.controlnet_conditioning_scale
            )
        
        generated_img = result.images[0]
        
        # Convert to base64
        buffer = io.BytesIO()
        generated_img.save(buffer, format="PNG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        logger.info("✅ Image generated successfully!")
        
        return GenerateResponse(
            image_base64=f"data:image/png;base64,{img_base64}",
            metadata={
                "prompt": request.prompt,
                "steps": request.num_inference_steps,
                "guidance_scale": request.guidance_scale,
                "device": device,
                "size": list(generated_img.size)
            }
        )
        
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)