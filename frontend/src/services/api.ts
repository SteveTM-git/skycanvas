const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const INFERENCE_URL = import.meta.env.VITE_INFERENCE_URL || 'http://localhost:8001';

export interface GenerateRequest {
  sketch_base64: string;
  prompt?: string;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  controlnet_conditioning_scale?: number;
}

export interface GenerateResponse {
  image_base64: string;
  metadata: {
    prompt: string;
    steps: number;
    guidance_scale: number;
    device: string;
    size: number[];
  };
}

export class AirSketchAPI {
  private wsConnection: WebSocket | null = null;

  connectWebSocket(onMessage?: (data: any) => void): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/draw`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        this.wsConnection = ws;
        resolve(ws);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.wsConnection = null;
      };
    });
  }

  sendDrawData(data: any) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    }
  }

  disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  async generateImage(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await fetch(`${INFERENCE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Generate image error:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; connections: number }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }

  async inferenceHealthCheck(): Promise<{ status: string; device: string; model_loaded: boolean }> {
    const response = await fetch(`${INFERENCE_URL}/health`);
    return response.json();
  }
}

export const api = new AirSketchAPI();