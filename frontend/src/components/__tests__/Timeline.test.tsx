import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { Timeline } from '../../components/Timeline';
import { useAppStore } from '../../store/useAppStore';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
});

describe('Timeline', () => {
  it('shows empty state when no session is selected', () => {
    render(<Timeline />);
    expect(screen.getByText('No session selected')).toBeInTheDocument();
  });

  it('shows empty snippet state when session has no snippets', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Empty');
    });
    render(<Timeline />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders snippets for the current session', () => {
    let sessionId: string;
    act(() => {
      sessionId = useAppStore.getState().createSession('PROJ-1', 'With Snippets');
      useAppStore.getState().addSnippet(sessionId, 'TEXT', 'This is my note');
      useAppStore.getState().addSnippet(sessionId, 'CODE', 'const x = 1;');
    });
    render(<Timeline />);
    expect(screen.getByText('This is my note')).toBeInTheDocument();
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('renders the session title and ticketId', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-42', 'My Feature');
    });
    render(<Timeline />);
    expect(screen.getByText('My Feature')).toBeInTheDocument();
    expect(screen.getByText('PROJ-42')).toBeInTheDocument();
  });
});
