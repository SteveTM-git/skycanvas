import { useEffect } from 'react';

interface KeyboardShortcuts {
  onUndo?: () => void;
  onClear?: () => void;
  onGenerate?: () => void;
  onGallery?: () => void;
  onHelp?: () => void;
  onToggleMode?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + Z - Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        shortcuts.onUndo?.();
      }

      // Cmd/Ctrl + K - Clear
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts.onClear?.();
      }

      // Cmd/Ctrl + Enter - Generate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        shortcuts.onGenerate?.();
      }

      // G - Open Gallery
      if (e.key === 'g') {
        e.preventDefault();
        shortcuts.onGallery?.();
      }

      // ? - Show Help
      if (e.key === '?') {
        e.preventDefault();
        shortcuts.onHelp?.();
      }

      // M - Toggle Mode
      if (e.key === 'm') {
        e.preventDefault();
        shortcuts.onToggleMode?.();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
};

export default useKeyboardShortcuts;