import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface TextInputPanelProps {
  sessionId: string;
}

export function TextInputPanel({ sessionId }: TextInputPanelProps) {
  const addSnippet = useAppStore((s) => s.addSnippet);
  const [text, setText] = useState('');
  const [type, setType] = useState<'TEXT' | 'CODE'>('TEXT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addSnippet(sessionId, type, trimmed);
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'TEXT' | 'CODE')}
            className="text-sm px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 focus:outline-none focus:border-purple-500"
            aria-label="Snippet type"
          >
            <option value="TEXT">Text</option>
            <option value="CODE">Code</option>
          </select>
        </div>
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
          <button
            type="submit"
            disabled={!text.trim()}
            className="self-end px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Ctrl+Enter to submit &bull; Or paste (Ctrl+V) images/text anywhere
        </p>
      </div>
    </form>
  );
}
