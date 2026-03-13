import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { TopBar } from '../../components/TopBar';
import { useAppStore } from '../../store/useAppStore';
import * as summarizeApiModule from '../../api/summarizeApi';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
  vi.restoreAllMocks();
});

describe('TopBar', () => {
  it('shows "No session active" when there is no session', () => {
    render(<TopBar onSummaryReady={vi.fn()} />);
    expect(screen.getByText('No session active')).toBeInTheDocument();
  });

  it('shows the current session info when a session exists', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar onSummaryReady={vi.fn()} />);
    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    expect(screen.getByText('Auth Feature')).toBeInTheDocument();
  });

  it('disables Generate Summary when no session selected', () => {
    render(<TopBar onSummaryReady={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Generate Summary' })).toBeDisabled();
  });

  it('disables Generate Summary when session has no snippets', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Empty');
    });
    render(<TopBar onSummaryReady={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Generate Summary' })).toBeDisabled();
  });

  it('enables Generate Summary when session has snippets', () => {
    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'With content');
      useAppStore.getState().addSnippet(id, 'TEXT', 'Some note');
    });
    render(<TopBar onSummaryReady={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Generate Summary' })).not.toBeDisabled();
  });

  it('calls onSummaryReady with summary on successful API call', async () => {
    const onSummaryReady = vi.fn();
    vi.spyOn(summarizeApiModule, 'summarizeSession').mockResolvedValue({
      summary: 'A great summary.',
    });

    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(id, 'TEXT', 'note');
    });

    render(<TopBar onSummaryReady={onSummaryReady} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }));

    await waitFor(() => {
      expect(onSummaryReady).toHaveBeenCalledWith('A great summary.');
    });
  });

  it('shows error message when API call fails', async () => {
    vi.spyOn(summarizeApiModule, 'summarizeSession').mockRejectedValue(
      new Error('Backend error'),
    );

    act(() => {
      const id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().addSnippet(id, 'TEXT', 'note');
    });

    render(<TopBar onSummaryReady={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Summary' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Backend error');
    });
  });
});
