import React, { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { compressImageToBase64 } from '../utils/imageUtils';

interface TextInputPanelProps {
  sessionId: string;
}

export function TextInputPanel({ sessionId }: TextInputPanelProps) {
  const addSnippet = useAppStore((s) => s.addSnippet);
  const [text, setText] = useState('');
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    // Always submit as TEXT — the LLM will interpret whether it's code or prose
    addSnippet(sessionId, 'TEXT', trimmed);
    setText('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachError(null);

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await compressImageToBase64(file);
          addSnippet(sessionId, 'IMAGE', base64);
        } catch {
          setAttachError(`Could not process image: ${file.name}`);
        }
      } else {
        // Treat as a text/log file
        try {
          const text = await file.text();
          const truncated = text.length > 5000 ? text.slice(0, 5000) + '\n... [truncated]' : text;
          addSnippet(sessionId, 'TEXT', truncated);
        } catch {
          setAttachError(`Could not read file: ${file.name}`);
        }
      }
    }

    // Reset so the same file can be re-attached if needed
    e.target.value = '';
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 shrink-0"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a note or paste text here..."
            rows={3}
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit(e);
              }
            }}
          />
          <div className="flex flex-col gap-2 self-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              aria-label="Attach file"
              title="Attach image or log file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49"/>
              </svg>
              Attach
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>
        {attachError && (
          <p className="text-xs text-red-500 mt-1" role="alert">{attachError}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Ctrl+Enter to submit &bull; Ctrl+V to paste image &bull; Attach to upload image or log file
        </p>
      </div>

      {/* Hidden file input — accepts images and common log/text files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.log,.txt,.json,.xml,.csv,.yaml,.yml,.md,.out,.err"
        className="hidden"
        onChange={handleFileChange}
        aria-label="File attachment input"
      />
    </form>
  );
}
