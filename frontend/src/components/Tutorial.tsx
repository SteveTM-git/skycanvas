import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to SkyCanvas!",
      content: "Draw in the sky with your hands and transform your sketches into stunning AI-generated images.",
      image: "🎨",
    },
    {
      title: "Step 1: Start Your Camera",
      content: "Click the 'Start Camera' button to enable your webcam. SkyCanvas uses your camera to track hand movements.",
      image: "📷",
    },
    {
      title: "Step 2: Show Your Hand",
      content: "Position your hand in front of the camera. You'll see green dots tracking your hand landmarks.",
      image: "✋",
    },
    {
      title: "Step 3: Choose Drawing Mode",
      content: "Pick Pinch mode (touch index and thumb) or Point mode (point with index finger).",
      image: "🤏",
    },
    {
      title: "Step 4: Draw Your Art",
      content: "Make your gesture and move your hand to draw. Green cursor = drawing, Blue cursor = ready.",
      image: "✏️",
    },
    {
      title: "Step 5: Generate AI Image",
      content: "Click 'Generate Image', describe what you want, and watch AI transform your sketch!",
      image: "✨",
    },
    {
      title: "Keyboard Shortcuts",
      content: "Cmd/Ctrl + Z: Undo\nCmd/Ctrl + K: Clear\nCmd/Ctrl + Enter: Generate\nG: Gallery\nM: Toggle Mode\n?: Help",
      image: "⌨️",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('skycanvas_tutorial_completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('skycanvas_tutorial_completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Skip Tutorial
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-6xl mb-6">{step.image}</div>
          <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
          <p className="text-slate-300 text-lg whitespace-pre-line leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 px-8 pb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-purple-500 w-8'
                  : index < currentStep
                  ? 'bg-purple-500/50'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg flex items-center gap-2 transition-colors font-semibold"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;