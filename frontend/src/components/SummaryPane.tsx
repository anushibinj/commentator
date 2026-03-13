import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '../store/useAppStore';
import { summarizeSession } from '../api/summarizeApi';
import type { SummarizeRequest } from '../types';

const DEBOUNCE_MS = 1200;

export function SummaryPane() {
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const sessions = useAppStore((s) => s.sessions);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;
  const snippets = currentSession?.snippets ?? [];

  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which session the current summary belongs to so we clear on switch
  const summarySessionRef = useRef<string | null>(null);

  useEffect(() => {
    // Session switched — clear stale summary immediately
    if (currentSessionId !== summarySessionRef.current) {
      setSummary(null);
      setError(null);
      setIsLoading(false);
      summarySessionRef.current = currentSessionId;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }

    if (!currentSession || snippets.length === 0) return;

    // Debounce: wait for user to stop adding snippets before calling API
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const request: SummarizeRequest = {
          ticketId: currentSession.ticketId,
          items: currentSession.snippets.map(({ type, content }) => ({ type, content })),
        };
        const response = await summarizeSession(request);
        setSummary(response.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate summary');
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, snippets.length, currentSession?.lastUpdated]);

  const handleCopy = () => {
    if (summary) navigator.clipboard.writeText(summary).catch(console.error);
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          Jira Work Log
        </h2>
        {summary && !isLoading && (
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
          >
            Copy
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {!currentSession ? (
          <p className="text-sm text-gray-400 text-center mt-12">
            Select or create a session to get started.
          </p>
        ) : snippets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-12">
            Start adding your work to auto-generate the summary.
          </p>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-12 justify-center">
            <span className="inline-block w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Generating...
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 mt-4" role="alert">
            {error}
          </p>
        ) : summary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}
