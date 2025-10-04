import React, { useRef, useEffect, useState } from 'react';
import { Camera, Download, Trash2, RotateCcw, Sparkles, Image as ImageIcon, HelpCircle } from 'lucide-react';
import GenerationModal from './GenerationModal';
import Gallery from './Gallery';
import Tutorial from './Tutorial';
import HelpModal from './HelpModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface Point {
  x: number;
  y: number;
}

declare global {
  interface Window {
    eraseTimeout?: NodeJS.Timeout;
  }
}

const AirSketch: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Click "Start Camera" to begin');
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'pinch' | 'point'>('pinch');
  const [showGallery, setShowGallery] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const currentStroke = useRef<Point[]>([]);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lastPosition = useRef<Point | null>(null);
  const smoothingFactor = 0.5;

  // Check if tutorial should be shown
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('skycanvas_tutorial_completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    const loadMediaPipe = async () => {
      if (!cameraActive) return;

      try {
        setDebugInfo('Loading MediaPipe...');
        
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };

        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js');

        // @ts-ignore
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        if (videoRef.current) {
          // @ts-ignore
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
          cameraRef.current = camera;
          setDebugInfo('MediaPipe loaded - show your hand!');
        }
      } catch (err) {
        const errorMsg = `MediaPipe Error: ${(err as Error).message}`;
        setDebugInfo(errorMsg);
        console.error('MediaPipe loading error:', err);
      }
    };

    loadMediaPipe();

    return () => {
      if (cameraRef.current && cameraRef.current.stop) {
        cameraRef.current.stop();
      }
    };
  }, [cameraActive]);

  const onResults = (results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      const landmarks = results.multiHandLandmarks[0];

      ctx.fillStyle = '#00ff00';
      landmarks.forEach((landmark: any) => {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          5, 0, 2 * Math.PI
        );
        ctx.fill();
      });

      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];
      const indexDip = landmarks[7];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];

      const distance = Math.sqrt(
        Math.pow((indexTip.x - thumbTip.x) * canvas.width, 2) +
        Math.pow((indexTip.y - thumbTip.y) * canvas.height, 2)
      );

      const indexExtended = indexTip.y < indexDip.y;
      const middleFolded = middleTip.y > landmarks[10].y;

      const allFingersExtended = 
        indexTip.y < landmarks[6].y &&
        middleTip.y < landmarks[10].y &&
        ringTip.y < landmarks[14].y &&
        pinkyTip.y < landmarks[18].y;

      if (allFingersExtended) {
        const palmX = landmarks[0].x * canvas.width;
        const palmY = landmarks[0].y * canvas.height;
        
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(palmX, palmY, 40, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(palmX, palmY, 40, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ERASE', palmX, palmY + 5);
        
        setDebugInfo('✋ PALM - Hold for 2 seconds to Erase Canvas');
        
        if (!window.eraseTimeout) {
          window.eraseTimeout = setTimeout(() => {
            clearCanvas();
            window.eraseTimeout = undefined;
          }, 2000);
        }
        
        return;
      } else {
        if (window.eraseTimeout) {
          clearTimeout(window.eraseTimeout);
          window.eraseTimeout = undefined;
        }
      }

      const shouldDraw = drawMode === 'pinch' 
        ? distance < 60
        : indexExtended && middleFolded;

      const drawCanvas = drawCanvasRef.current;
      const drawCtx = drawCanvas?.getContext('2d');

      if (drawCtx && drawCanvas) {
        let x = indexTip.x * drawCanvas.width;
        let y = indexTip.y * drawCanvas.height;

        if (lastPosition.current) {
          x = lastPosition.current.x + (x - lastPosition.current.x) * smoothingFactor;
          y = lastPosition.current.y + (y - lastPosition.current.y) * smoothingFactor;
        }
        lastPosition.current = { x, y };

        if (shouldDraw) {
          setIsDrawing(true);
          currentStroke.current.push({ x, y });
          setHasDrawing(true);

          drawCtx.strokeStyle = '#3b82f6';
          drawCtx.lineWidth = 5;
          drawCtx.lineCap = 'round';
          drawCtx.lineJoin = 'round';

          if (currentStroke.current.length > 1) {
            const prev = currentStroke.current[currentStroke.current.length - 2];
            drawCtx.beginPath();
            drawCtx.moveTo(prev.x, prev.y);
            drawCtx.lineTo(x, y);
            drawCtx.stroke();
          }

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(x, y, 25, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x, y, 25, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          if (isDrawing && currentStroke.current.length > 0) {
            setStrokes(prev => [...prev, [...currentStroke.current]]);
            currentStroke.current = [];
          }
          setIsDrawing(false);

          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      const modeText = drawMode === 'pinch' ? '🤏 PINCH' : '👆 POINT';
      const statusText = shouldDraw ? '🟢 DRAWING' : '🔵 Ready';
      setDebugInfo(`${statusText} | Mode: ${modeText} | Strokes: ${strokes.length}`);
    } else {
      setHandDetected(false);
      setDebugInfo('👋 Show your hand to the camera');
      if (isDrawing && currentStroke.current.length > 0) {
        setStrokes(prev => [...prev, [...currentStroke.current]]);
        currentStroke.current = [];
      }
      setIsDrawing(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      const errorMsg = `Camera Error: ${(err as Error).message}`;
      setDebugInfo(errorMsg);
      alert('Please allow camera access to use SkyCanvas');
    }
  };

  const clearCanvas = () => {
    const drawCanvas = drawCanvasRef.current;
    const ctx = drawCanvas?.getContext('2d');
    if (ctx && drawCanvas) {
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      setStrokes([]);
      currentStroke.current = [];
      setHasDrawing(false);
    }
  };

  const undoStroke = () => {
    if (strokes.length === 0) return;

    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);

    const drawCanvas = drawCanvasRef.current;
    const ctx = drawCanvas?.getContext('2d');
    if (ctx && drawCanvas) {
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      
      if (newStrokes.length === 0) {
        setHasDrawing(false);
        return;
      }
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      newStrokes.forEach(stroke => {
        if (stroke.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stroke[0].x, stroke[0].y);
          stroke.slice(1).forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
      });
    }
  };

  const downloadSketch = () => {
    const drawCanvas = drawCanvasRef.current;
    if (drawCanvas) {
      const link = document.createElement('a');
      link.download = `skycanvas-${Date.now()}.png`;
      link.href = drawCanvas.toDataURL();
      link.click();
    }
  };

  const generateImage = () => {
    if (!hasDrawing) {
      alert('Please draw something first!');
      return;
    }
    setShowGenerateModal(true);
  };

  // Keyboard shortcuts - MUST be after all function definitions
  useKeyboardShortcuts({
    onUndo: undoStroke,
    onClear: clearCanvas,
    onGenerate: generateImage,
    onGallery: () => setShowGallery(true),
    onHelp: () => setShowHelp(true),
    onToggleMode: () => setDrawMode(prev => prev === 'pinch' ? 'point' : 'pinch'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SkyCanvas
            </h1>
            <button
              onClick={() => setShowGallery(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
              title="Open Gallery (G)"
            >
              <ImageIcon className="w-4 h-4" />
              Gallery
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-300 text-sm sm:text-base">
            Draw in the sky with hand gestures • AI transforms your art
          </p>
        </div>

        {/* Rest of your JSX remains the same... */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 sm:p-6 border border-slate-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Feed
            </h2>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Hand Detection:</span>
                <span className={handDetected ? 'text-green-400' : 'text-yellow-400'}>
                  {handDetected ? '✓ Active' : '○ Searching...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Draw Mode:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDrawMode('point')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      drawMode === 'point' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    👆 Point
                  </button>
                  <button
                    onClick={() => setDrawMode('pinch')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      drawMode === 'pinch' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🤏 Pinch
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {debugInfo}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 sm:p-6 border border-slate-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Sketch</h2>
            <div className="relative aspect-video bg-white rounded-lg overflow-hidden">
              <canvas
                ref={drawCanvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full"
              />
              {strokes.length === 0 && !hasDrawing && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                  Start drawing with your gesture
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={undoStroke}
                disabled={!hasDrawing || strokes.length === 0}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                title="Undo (Cmd+Z)"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </button>
              <button
                onClick={clearCanvas}
                disabled={!hasDrawing}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                title="Clear (Cmd+K)"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={downloadSketch}
                disabled={!hasDrawing}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur rounded-xl p-4 sm:p-6 border border-purple-500/30 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Ready to generate?</h3>
              <p className="text-sm text-slate-300">Transform your sketch into a photoreal image with AI</p>
            </div>
            <button
              onClick={generateImage}
              disabled={!hasDrawing}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Generate Image
            </button>
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur rounded-xl p-4 sm:p-6 border border-slate-700/50">
          <h3 className="font-semibold mb-3 text-lg">How to use:</h3>
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300 font-semibold mb-2">✨ Super Simple Drawing:</p>
            <p className="text-xs text-slate-300 mb-2">
              <strong className="text-green-400">🟢 Green = Drawing:</strong> Make your gesture and it draws immediately!
            </p>
            <p className="text-xs text-slate-300">
              <strong className="text-blue-400">🔵 Blue = Not Drawing:</strong> Release gesture to stop
            </p>
          </div>
          <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300 font-semibold mb-2">🤏 Choose Your Mode:</p>
            <p className="text-xs text-slate-300 mb-1">
              <strong className="text-purple-400">🤏 Pinch (Easier!):</strong> Just bring index and thumb close together
            </p>
            <p className="text-xs text-slate-300 mb-1">
              <strong className="text-blue-400">👆 Point:</strong> Point with index finger, fold other fingers
            </p>
            <p className="text-xs text-slate-300">
              <strong className="text-red-400">✋ Palm to Erase:</strong> Show palm (all fingers extended) for 2 seconds to clear canvas
            </p>
          </div>
          <ol className="space-y-2 text-sm text-slate-300">
            <li>1. Click <strong className="text-blue-400">"Start Camera"</strong></li>
            <li>2. Show your hand - see the <strong className="text-green-400">green dots</strong></li>
            <li>3. Pick a mode: <strong className="text-purple-400">🤏 Pinch</strong> (easier!) or <strong className="text-blue-400">👆 Point</strong></li>
            <li>4. Make your gesture - <strong className="text-green-400">green cursor</strong> means drawing!</li>
            <li>5. Move your hand slowly and smoothly to draw</li>
            <li>6. Release gesture when done (cursor turns blue)</li>
            <li>7. <strong className="text-red-400">Show palm (all fingers extended)</strong> for 2 seconds to erase everything</li>
            <li>8. Use Undo/Clear/Save for your sketch</li>
            <li>9. Hit "Generate Image" to see AI magic!</li>
          </ol>
        </div>
      </div>

      <GenerationModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        sketchData={drawCanvasRef.current?.toDataURL('image/png') || ''}
      />

      <Gallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
      />

      <Tutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default AirSketch;