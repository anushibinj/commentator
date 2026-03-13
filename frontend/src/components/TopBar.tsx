import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export function TopBar() {
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const sessions = useAppStore((s) => s.sessions);
  const updateSession = useAppStore((s) => s.updateSession);
  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editTicketId, setEditTicketId] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = () => {
    if (currentSession) {
      setEditTicketId(currentSession.ticketId);
      setEditTitle(currentSession.title);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (currentSessionId && (editTicketId.trim() || editTitle.trim())) {
      updateSession(
        currentSessionId,
        editTicketId.trim() ? editTicketId.trim().toUpperCase() : undefined,
        editTitle.trim() ? editTitle.trim() : undefined,
      );
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTicketId('');
    setEditTitle('');
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
      {currentSession ? (
        <>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editTicketId}
                onChange={(e) => setEditTicketId(e.target.value)}
                placeholder={currentSession.ticketId}
                className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                aria-label="Edit ticket ID"
                autoFocus
              />
              <span className="text-gray-400">—</span>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={currentSession.title}
                className="flex-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                aria-label="Edit session title"
              />
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
                aria-label="Save changes"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded transition-colors"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              onClick={handleStartEdit}
              className="flex items-center cursor-pointer hover:opacity-70 transition-opacity flex-1"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleStartEdit()}
              aria-label={`Click to edit: ${currentSession.ticketId} — ${currentSession.title}`}
            >
              <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
                {currentSession.ticketId}
              </span>
              <span className="text-gray-400 mx-2">—</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {currentSession.title}
              </span>
            </div>
          )}
        </>
      ) : (
        <span className="text-sm text-gray-400">No session active</span>
      )}
    </header>
  );
}
