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

  it('does not auto-generate when summary is already cached', async () => {
    const mockSummarize = vi.spyOn(summarizeApiModule, 'summarizeSession');

    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(id, 'TEXT', 'Work');
      useAppStore.getState().updateSessionSummary(id, 'Cached summary');
    });

    render(<SummaryPane />);

    // Wait a bit to ensure no async calls happen
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not call API if summary already cached
    expect(mockSummarize).not.toHaveBeenCalled();
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

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));

    await waitFor(() => {
      expect(mockSummarize).toHaveBeenCalled();
    });
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
