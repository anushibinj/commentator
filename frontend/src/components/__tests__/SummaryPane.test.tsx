import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { SummaryPane } from '../../components/SummaryPane';
import { useAppStore } from '../../store/useAppStore';
import * as summarizeApiModule from '../../api/summarizeApi';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
  vi.restoreAllMocks();
  vi.clearAllTimers();
});

describe('SummaryPane', () => {
  it('shows empty state when no session is selected', () => {
    render(<SummaryPane />);
    expect(screen.getByText(/Select or create a session/i)).toBeInTheDocument();
  });

  it('shows start message when session has no snippets', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    render(<SummaryPane />);
    expect(screen.getByText(/Start adding your work/i)).toBeInTheDocument();
  });

  it('persists and displays cached summary', async () => {
    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(id, 'TEXT', 'Work');
      useAppStore.getState().updateSessionSummary(id, 'Cached summary text');
    });

    render(<SummaryPane />);

    await waitFor(() => {
      expect(screen.getByText('Cached summary text')).toBeInTheDocument();
    });
  });

  it('does NOT auto-generate on mount when a cached summary already exists (page refresh)', async () => {
    const mockSummarize = vi.spyOn(summarizeApiModule, 'summarizeSession');

    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(id, 'TEXT', 'Work');
      useAppStore.getState().updateSessionSummary(id, 'Cached summary');
    });

    render(<SummaryPane />);

    // Wait long enough that any debounce would have fired
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(mockSummarize).not.toHaveBeenCalled();
  });

  it('auto-generates when a new snippet is added even if summary is cached', async () => {
    const mockSummarize = vi.spyOn(summarizeApiModule, 'summarizeSession')
      .mockResolvedValue({ summary: 'Updated summary' });

    let sessionId: string;
    act(() => {
      sessionId = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(sessionId, 'TEXT', 'Initial work');
      useAppStore.getState().updateSessionSummary(sessionId, 'Initial summary');
    });

    // Render with the cached summary already in place
    render(<SummaryPane />);

    // Confirm no call yet (cached summary, no new snippet)
    expect(mockSummarize).not.toHaveBeenCalled();

    // Now add a new snippet — this should trigger regeneration
    act(() => {
      useAppStore.getState().addSnippet(sessionId!, 'TEXT', 'More work');
    });

    // Wait for debounce and API call
    await waitFor(() => {
      expect(mockSummarize).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('shows Copy button when summary exists', async () => {
    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().updateSessionSummary(id, 'Summary here');
    });

    render(<SummaryPane />);

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('shows Regenerate button when summary exists', async () => {
    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().updateSessionSummary(id, 'Summary here');
    });

    render(<SummaryPane />);

    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument();
  });

  it('copies summary to clipboard when Copy is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    });

    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().updateSessionSummary(id, 'Copy me');
    });

    render(<SummaryPane />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('Copy me');
  });

  it('calls API to regenerate when Regenerate is clicked', async () => {
    const mockSummarize = vi.spyOn(summarizeApiModule, 'summarizeSession')
      .mockResolvedValue({ summary: 'New summary.' });

    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(id, 'TEXT', 'Work');
      useAppStore.getState().updateSessionSummary(id, 'Old summary.');
    });

    render(<SummaryPane />);

    // Clear the mock to track only the Regenerate button click
    mockSummarize.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));

    await waitFor(() => {
      expect(mockSummarize).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('auto-generates when a snippet is deleted', async () => {
    const mockSummarize = vi.spyOn(summarizeApiModule, 'summarizeSession')
      .mockResolvedValue({ summary: 'Updated after delete' });

    let sessionId: string;
    let snippetId: string;
    act(() => {
      sessionId = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(sessionId, 'TEXT', 'First note');
      useAppStore.getState().addSnippet(sessionId, 'TEXT', 'Second note');
      snippetId = Object.values(useAppStore.getState().sessions[sessionId].snippets)[1].id;
      useAppStore.getState().updateSessionSummary(sessionId, 'Initial summary');
    });

    render(<SummaryPane />);
    expect(mockSummarize).not.toHaveBeenCalled();

    act(() => {
      useAppStore.getState().deleteSnippet(sessionId!, snippetId!);
    });

    await waitFor(() => {
      expect(mockSummarize).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('auto-generates when a snippet is edited', async () => {
    const mockSummarize = vi.spyOn(summarizeApiModule, 'summarizeSession')
      .mockResolvedValue({ summary: 'Updated after edit' });

    let sessionId: string;
    let snippetId: string;
    act(() => {
      sessionId = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(sessionId, 'TEXT', 'Original note');
      snippetId = Object.values(useAppStore.getState().sessions[sessionId].snippets)[0].id;
      useAppStore.getState().updateSessionSummary(sessionId, 'Initial summary');
    });

    render(<SummaryPane />);
    expect(mockSummarize).not.toHaveBeenCalled();

    act(() => {
      useAppStore.getState().updateSnippet(sessionId!, snippetId!, 'Edited note');
    });

    await waitFor(() => {
      expect(mockSummarize).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('does not show Copy and Regenerate buttons when no summary', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });

    render(<SummaryPane />);

    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Regenerate' })).not.toBeInTheDocument();
  });
});
