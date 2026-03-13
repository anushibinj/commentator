import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { TopBar } from './components/TopBar';
import { SummaryPane } from './components/SummaryPane';
import { TextInputPanel } from './components/TextInputPanel';
import { useGlobalPaste } from './hooks/useGlobalPaste';
import { useAppStore } from './store/useAppStore';

function App() {
  const currentSessionId = useAppStore((s) => s.currentSessionId);

  useGlobalPaste(currentSessionId);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      {/* Center: inputs */}
      <div className="flex flex-col min-w-0" style={{ flex: '1 1 0' }}>
        <TopBar />
        <Timeline />
        {currentSessionId && <TextInputPanel sessionId={currentSessionId} />}
      </div>
      {/* Right: live summary */}
      <div className="flex flex-col shrink-0" style={{ width: '38%' }}>
        <SummaryPane />
      </div>
    </div>
  );
}

export default App;
