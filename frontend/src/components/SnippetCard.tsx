import { useState } from 'react';
import type { Snippet } from '../types';

interface SnippetCardProps {
  snippet: Snippet;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SnippetCard({ snippet, onDelete, onUpdate }: SnippetCardProps) {
  const { id, timestamp, type, content } = snippet;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  const handleEditStart = () => {
    if (type === 'IMAGE') return; // images not editable
    setDraft(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== content) {
      onUpdate(id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <article className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
              type === 'IMAGE'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : type === 'CODE'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            }`}
          >
            {type}
          </span>
          <time
            dateTime={new Date(timestamp).toISOString()}
            className="text-xs text-gray-400"
          >
            {formatTime(timestamp)}
          </time>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {type !== 'IMAGE' && !isEditing && (
            <button
              onClick={handleEditStart}
              className="text-gray-400 hover:text-purple-500 text-xs"
              aria-label="Edit snippet"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => onDelete(id)}
            className="text-gray-400 hover:text-red-500 text-xs"
            aria-label="Delete snippet"
          >
            ✕
          </button>
        </div>
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-purple-400 rounded font-mono text-gray-800 dark:text-gray-200 focus:outline-none resize-y"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded font-medium"
            >
              Cancel
            </button>
            <span className="text-xs text-gray-400 self-center">Ctrl+Enter to save · Esc to cancel</span>
          </div>
        </div>
      ) : type === 'IMAGE' ? (
        <img
          src={`data:image/jpeg;base64,${content}`}
          alt="Attached screenshot"
          className="max-w-full rounded border border-gray-200 dark:border-gray-600"
          style={{ maxHeight: 400, objectFit: 'contain' }}
        />
      ) : type === 'CODE' ? (
        <pre
          className="overflow-x-auto text-sm bg-gray-50 dark:bg-gray-900 rounded p-3 text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-all cursor-pointer"
          onClick={handleEditStart}
          title="Click to edit"
        >
          <code>{content}</code>
        </pre>
      ) : (
        <p
          className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words cursor-pointer"
          onClick={handleEditStart}
          title="Click to edit"
        >
          {content}
        </p>
      )}
    </article>
  );
}
