import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { compressImageToBase64, detectContentType, truncateText } from '../utils/imageUtils';

export function useGlobalPaste(sessionId: string | null) {
  const addSnippet = useAppStore((s) => s.addSnippet);

  useEffect(() => {
    if (!sessionId) return;

    const handlePaste = async (e: ClipboardEvent) => {
      // If the user is pasting into a text input or textarea, let the browser
      // handle it natively — do not intercept and create a snippet.
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      // Check for image first
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          try {
            const base64 = await compressImageToBase64(file);
            addSnippet(sessionId, 'IMAGE', base64);
          } catch (err) {
            console.error('Failed to process pasted image:', err);
          }
          return;
        }
      }

      // Fall through to text
      for (const item of Array.from(items)) {
        if (item.type === 'text/plain') {
          item.getAsString((text) => {
            if (!text.trim()) return;
            const truncated = truncateText(text);
            const contentType = detectContentType(truncated);
            addSnippet(sessionId, contentType, truncated);
          });
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [sessionId, addSnippet]);
}
