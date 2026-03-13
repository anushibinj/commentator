import type { Snippet } from '../types';

interface SnippetCardProps {
  snippet: Snippet;
  onDelete: (id: string) => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SnippetCard({ snippet, onDelete }: SnippetCardProps) {
  const { id, timestamp, type, content } = snippet;

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
        <button
          onClick={() => onDelete(id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity"
          aria-label="Delete snippet"
        >
          ✕
        </button>
      </div>

      {type === 'IMAGE' ? (
        <img
          src={`data:image/jpeg;base64,${content}`}
          alt="Pasted screenshot"
          className="max-w-full rounded border border-gray-200 dark:border-gray-600"
          style={{ maxHeight: 400, objectFit: 'contain' }}
        />
      ) : type === 'CODE' ? (
        <pre className="overflow-x-auto text-sm bg-gray-50 dark:bg-gray-900 rounded p-3 text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-all">
          <code>{content}</code>
        </pre>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {content}
        </p>
      )}
    </article>
  );
}
