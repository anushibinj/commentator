import { useAppStore } from '../store/useAppStore';
import { SnippetCard } from './SnippetCard';

export function Timeline() {
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const sessions = useAppStore((s) => s.sessions);
  const deleteSnippet = useAppStore((s) => s.deleteSnippet);
  const updateSnippet = useAppStore((s) => s.updateSnippet);

  if (!currentSessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-lg font-medium">No session selected</p>
          <p className="text-sm mt-1">Create or select a session from the sidebar</p>
        </div>
      </div>
    );
  }

  const session = sessions[currentSessionId];
  if (!session) return null;

  const handleDelete = (snippetId: string) => {
    deleteSnippet(currentSessionId, snippetId);
  };

  const handleUpdate = (snippetId: string, content: string) => {
    updateSnippet(currentSessionId, snippetId, content);
  };

  const sortedSnippets = [...session.snippets].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {session.title}
          </h2>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-mono">
            {session.ticketId}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {sortedSnippets.length} snippet{sortedSnippets.length !== 1 ? 's' : ''} &bull;
            Last updated {new Date(session.lastUpdated).toLocaleString()}
          </p>
        </div>

        {sortedSnippets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📎</div>
            <p className="text-base font-medium">Nothing here yet</p>
            <p className="text-sm mt-1">
              Paste text or images, or use the input panel below
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
