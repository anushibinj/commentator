import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { useAppStore } from '../../store/useAppStore';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
  vi.restoreAllMocks();
});

describe('Sidebar', () => {
  it('renders the app title', () => {
    render(<Sidebar />);
    expect(screen.getByText('Commentator')).toBeInTheDocument();
  });

  it('shows "No sessions yet" when there are no sessions', () => {
    render(<Sidebar />);
    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
  });

  it('shows the new session form when New Session is clicked', async () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('+ New Session'));
    expect(screen.getByPlaceholderText('Ticket ID (e.g. PROJ-1234)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Session title')).toBeInTheDocument();
  });

  it('creates a session on form submit', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('+ New Session'));
    fireEvent.change(screen.getByLabelText('Ticket ID'), {
      target: { value: 'PROJ-99' },
    });
    fireEvent.change(screen.getByLabelText('Session title'), {
      target: { value: 'My Session' },
    });
    fireEvent.click(screen.getByText('Create'));

    const sessions = useAppStore.getState().sessions;
    const sessionList = Object.values(sessions);
    expect(sessionList).toHaveLength(1);
    expect(sessionList[0].ticketId).toBe('PROJ-99');
    expect(sessionList[0].title).toBe('My Session');
  });

  it('cancels session creation', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('+ New Session'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('+ New Session')).toBeInTheDocument();
  });

  it('does not create a session when fields are empty', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('+ New Session'));
    fireEvent.click(screen.getByText('Create'));
    expect(Object.keys(useAppStore.getState().sessions)).toHaveLength(0);
  });

  it('renders existing sessions', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'First Session');
    });
    render(<Sidebar />);
    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    expect(screen.getByText('First Session')).toBeInTheDocument();
  });

  it('selects a session on click', () => {
    let id: string;
    act(() => {
      id = useAppStore.getState().createSession('PROJ-1', 'Test');
      useAppStore.getState().selectSession('');
      useAppStore.setState({ currentSessionId: null });
    });
    render(<Sidebar />);
    fireEvent.click(screen.getByText('Test'));
    expect(useAppStore.getState().currentSessionId).toBe(id!);
  });

  it('deletes a session on delete button click', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'To Delete');
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Delete session PROJ-1'));
    expect(Object.keys(useAppStore.getState().sessions)).toHaveLength(0);
  });

  it('does not delete session if confirm is cancelled', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Keep Me');
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Delete session PROJ-1'));
    expect(Object.keys(useAppStore.getState().sessions)).toHaveLength(1);
  });
});
