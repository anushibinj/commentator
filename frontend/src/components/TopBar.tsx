import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { summarizeSession } from '../api/summarizeApi';
import type { SummarizeRequest } from '../types';

interface TopBarProps {
  onSummaryReady: (summary: string) => void;
}

export function TopBar({ onSummaryReady }: TopBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const sessions = useAppStore((s) => s.sessions);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

  const handleSummarize = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const request: SummarizeRequest = {
        ticketId: currentSession.ticketId,
        items: currentSession.snippets.map(({ type, content }) => ({ type, content })),
      };

      const response = await summarizeSession(request);
      onSummaryReady(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  const canSummarize = currentSession && currentSession.snippets.length > 0;

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div>
        {currentSession ? (
          <div>
            <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
              {currentSession.ticketId}
            </span>
            <span className="text-gray-400 mx-2">—</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {currentSession.title}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No session active</span>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          Paste text or images anywhere to capture snippets
        </p>
      </div>

      <div className="flex items-center gap-3">
        {error && (
          <span className="text-xs text-red-500 max-w-48 text-right" role="alert">
            {error}
          </span>
        )}
        <button
          onClick={handleSummarize}
          disabled={!canSummarize || isLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Summary'
          )}
        </button>
      </div>
    </header>
  );
}
