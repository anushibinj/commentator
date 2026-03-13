import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { TopBar } from './components/TopBar';
import { SummaryModal } from './components/SummaryModal';
import { TextInputPanel } from './components/TextInputPanel';
import { useGlobalPaste } from './hooks/useGlobalPaste';
import { useAppStore } from './store/useAppStore';

function App() {
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const [summary, setSummary] = useState<string | null>(null);

  useGlobalPaste(currentSessionId);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onSummaryReady={setSummary} />
        <Timeline />
        {currentSessionId && <TextInputPanel sessionId={currentSessionId} />}
      </div>
      {summary && <SummaryModal summary={summary} onClose={() => setSummary(null)} />}
    </div>
  );
}

export default App;
