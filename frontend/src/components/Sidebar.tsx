import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const sessions = useAppStore((s) => s.sessions);
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const createSession = useAppStore((s) => s.createSession);
  const selectSession = useAppStore((s) => s.selectSession);
  const deleteSession = useAppStore((s) => s.deleteSession);

  const [isCreating, setIsCreating] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [title, setTitle] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim() || !title.trim()) return;
    createSession(ticketId.trim().toUpperCase(), title.trim());
    setTicketId('');
    setTitle('');
    setIsCreating(false);
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Delete this session and all its snippets?')) {
      deleteSession(sessionId);
    }
  };

  const sessionList = Object.entries(sessions).sort(
    ([, a], [, b]) => b.lastUpdated - a.lastUpdated,
  );

  return (
    <aside
      className={`flex-shrink-0 bg-gray-900 text-white flex flex-col h-screen transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with toggle button */}
      <div className={`p-4 border-b border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-bold text-purple-400">Commentator</h1>
            <p className="text-xs text-gray-400 mt-1">Developer Work Log Summarizer</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-purple-400 transition-colors flex-shrink-0"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Create session button/form */}
      {!isCollapsed && (
        <div className="p-3 border-b border-gray-700">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-2">
              <input
                type="text"
                placeholder="Ticket ID (e.g. PROJ-1234)"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                aria-label="Ticket ID"
                autoFocus
              />
              <input
                type="text"
                placeholder="Session title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                aria-label="Session title"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded font-medium transition-colors"
            >
              + New Session
            </button>
          )}
        </div>
      )}

      {/* Session list */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-1' : 'p-2'} space-y-1`}>
        {sessionList.length === 0 && !isCollapsed && (
          <p className="text-xs text-gray-500 text-center py-4">No sessions yet</p>
        )}
        {sessionList.map(([id, session]) => (
          <div
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => selectSession(id)}
            onKeyDown={(e) => e.key === 'Enter' && selectSession(id)}
            className={`group flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } px-3 py-2 rounded cursor-pointer transition-colors ${
              currentSessionId === id
                ? 'bg-purple-700 text-white'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            title={
              isCollapsed
                ? `${session.ticketId}: ${session.title} (${session.snippets.length} snippet${session.snippets.length !== 1 ? 's' : ''})`
                : undefined
            }
          >
            {isCollapsed ? (
              <span className="text-xs font-mono font-semibold">{session.ticketId[0]}</span>
            ) : (
              <>
                <div className="min-w-0">
                  <div className="text-xs font-mono font-semibold text-purple-300 truncate">
                    {session.ticketId}
                  </div>
                  <div className="text-sm truncate">{session.title}</div>
                  <div className="text-xs text-gray-500">
                    {session.snippets.length} snippet{session.snippets.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, id)}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 text-xs transition-opacity"
                  aria-label={`Delete session ${session.ticketId}`}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
