import { useAppStore } from '../store/useAppStore';

export function TopBar() {
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const sessions = useAppStore((s) => s.sessions);
  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

  return (
    <header className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
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
      <p className="text-xs text-gray-400 mt-0.5 ml-4">
        Paste (Ctrl+V) or attach images and files anywhere
      </p>
    </header>
  );
}
