import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '../store/useAppStore';
import { summarizeSession } from '../api/summarizeApi';
import type { SummarizeRequest } from '../types';

const DEBOUNCE_MS = 1200;

export function SummaryPane() {
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const sessions = useAppStore((s) => s.sessions);
  const updateSessionSummary = useAppStore((s) => s.updateSessionSummary);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;
  const snippets = currentSession?.snippets ?? [];
  const cachedSummary = currentSession?.summary ?? null;
  const lastUpdated = currentSession?.lastUpdated ?? 0;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRefRef = useRef<string | null>(null);
  const snippetCountRef = useRef<number>(snippets.length);
  const lastUpdatedRef = useRef<number>(lastUpdated);

  // Auto-generate only when:
  // 1. No cached summary and snippets exist (first time for a session with no summary)
  // 2. A snippet is added, edited, or deleted — detected via count change or lastUpdated change
  // Does NOT trigger on mount when a cached summary already exists (e.g. page refresh)
  useEffect(() => {
    const prevSessionId = sessionRefRef.current;
    const prevCount = snippetCountRef.current;
    const prevLastUpdated = lastUpdatedRef.current;

    sessionRefRef.current = currentSessionId;
    snippetCountRef.current = snippets.length;
    lastUpdatedRef.current = lastUpdated;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const sessionSwitched = currentSessionId !== prevSessionId;

    if (sessionSwitched) {
      setError(null);
      // Only auto-gen if there's no cached summary yet
      if (!cachedSummary && snippets.length > 0) {
        debounceRef.current = setTimeout(() => generateSummary(), DEBOUNCE_MS);
      }
      return;
    }

    // Same session: regenerate if snippets were added, removed, or edited
    const snippetsChanged = snippets.length !== prevCount || lastUpdated !== prevLastUpdated;
    if (snippetsChanged && snippets.length > 0) {
      debounceRef.current = setTimeout(() => generateSummary(), DEBOUNCE_MS);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, snippets.length, lastUpdated]);

  const generateSummary = async () => {
    if (!currentSession) return;
    setIsGenerating(true);
    setError(null);
    try {
      const request: SummarizeRequest = {
        ticketId: currentSession.ticketId,
        items: currentSession.snippets.map(({ type, content }) => ({ type, content })),
      };
      const response = await summarizeSession(request);
      updateSessionSummary(currentSessionId!, response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (cachedSummary) navigator.clipboard.writeText(cachedSummary).catch(console.error);
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header */}
       <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
         <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
           Work Log Summary
         </h2>
        <div className="flex items-center gap-2">
          {cachedSummary && !isGenerating && (
            <>
              <button
                onClick={generateSummary}
                className="text-xs px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md font-medium transition-colors"
                title="Generate a new summary (may overwrite existing one)"
              >
                Regenerate
              </button>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
              >
                Copy
              </button>
            </>
          )}
          {isGenerating && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span className="inline-block w-2.5 h-2.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Generating...
            </div>
          )}
        </div>
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
        ) : isGenerating && !cachedSummary ? (
          <div className="flex flex-col items-center gap-2 text-sm text-gray-400 mt-12">
            <span className="inline-block w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Generating summary...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 mt-4" role="alert">
            {error}
          </p>
        ) : cachedSummary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
            <ReactMarkdown>{cachedSummary}</ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}
