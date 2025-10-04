import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Cmd/Ctrl', 'Z'], description: 'Undo last stroke' },
    { keys: ['Cmd/Ctrl', 'K'], description: 'Clear canvas' },
    { keys: ['Cmd/Ctrl', 'Enter'], description: 'Generate image' },
    { keys: ['G'], description: 'Open gallery' },
    { keys: ['M'], description: 'Toggle drawing mode' },
    { keys: ['?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Close modals' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-300">{shortcut.description}</span>
                <div className="flex gap-2">
                  {shortcut.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      <kbd className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-mono text-white">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="text-slate-500">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">?</kbd> anytime to show this help menu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;