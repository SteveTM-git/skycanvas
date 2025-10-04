import React, { useState } from 'react';
import { X, Sparkles, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sketchData: string;
}

const GenerationModal: React.FC<GenerationModalProps> = ({ isOpen, onClose, sketchData }) => {
  const [prompt, setPrompt] = useState('a beautiful photograph, high quality, detailed');
  const [negativePrompt, setNegativePrompt] = useState('ugly, blurry, low quality, distorted');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numSteps, setNumSteps] = useState(20);
  const [guidanceScale, setGuidanceScale] = useState(7.5);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await api.generateImage({
        sketch_base64: sketchData,
        prompt,
        negative_prompt: negativePrompt,
        num_inference_steps: numSteps,
        guidance_scale: guidanceScale,
      });

      setGeneratedImage(response.image_base64);
    } catch (err) {
      setError((err as Error).message);
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.download = `skycanvas-generated-${Date.now()}.png`;
      link.href = generatedImage;
      link.click();
    }
  };

  const saveToGallery = async () => {
    if (!generatedImage) return;
    
    try {
      await fetch('http://localhost:8000/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sketch_data: sketchData,
          image_data: generatedImage,
          prompt: prompt,
        }),
      });
      alert('Saved to gallery! 🎨');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save to gallery');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Generate Image</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sketch Preview */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Your Sketch</h3>
            <img
              src={sketchData}
              alt="Sketch"
              className="w-full max-w-md mx-auto rounded-lg border border-slate-700"
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe what you want to generate..."
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Negative Prompt (what to avoid)
            </label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="What you don't want in the image..."
            />
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Steps: {numSteps}
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={numSteps}
                onChange={(e) => setNumSteps(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">More steps = better quality, slower</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Guidance: {guidanceScale}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">Higher = closer to prompt</p>
            </div>
          </div>

          {/* Generate Button */}
          {!generatedImage && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating... (this may take 30-60 seconds)
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-xs text-slate-400 mt-2">
                Make sure the inference service is running on port 8001
              </p>
            </div>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-400">Generated Image</h3>
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-lg border border-slate-700"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={saveToGallery}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Save to Gallery
                </button>
                <button
                  onClick={() => {
                    setGeneratedImage(null);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Generate Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationModal;