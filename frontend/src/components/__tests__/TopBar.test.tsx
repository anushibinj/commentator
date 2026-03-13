import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { TopBar } from '../../components/TopBar';
import { useAppStore } from '../../store/useAppStore';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
});

describe('TopBar', () => {
  it('shows "No session active" when there is no session', () => {
    render(<TopBar />);
    expect(screen.getByText('No session active')).toBeInTheDocument();
  });

  it('shows the current session info when a session exists', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);
    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    expect(screen.getByText('Auth Feature')).toBeInTheDocument();
  });

  it('displays session ticket ID and title separated by em dash', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-99', 'My Task');
    });
    render(<TopBar />);
    expect(screen.getByText('PROJ-99')).toBeInTheDocument();
    expect(screen.getByText('My Task')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
