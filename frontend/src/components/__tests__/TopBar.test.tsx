import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('enters edit mode when clicking on the session info', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    expect(screen.getByDisplayValue('PROJ-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auth Feature')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel editing/i })).toBeInTheDocument();
  });

  it('enters edit mode when pressing Enter on the session info', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.keyboard('{Enter}');
    sessionDisplay.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByDisplayValue('PROJ-1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auth Feature')).toBeInTheDocument();
  });

  it('updates ticket ID when edited and saved', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    const ticketIdInput = screen.getByDisplayValue('PROJ-1');
    await user.clear(ticketIdInput);
    await user.type(ticketIdInput, 'TASK-999');

    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('TASK-999')).toBeInTheDocument();
    });
    expect(screen.queryByDisplayValue('PROJ-1')).not.toBeInTheDocument();
    expect(screen.getByText('Auth Feature')).toBeInTheDocument();
  });

  it('updates title when edited and saved', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    const titleInput = screen.getByDisplayValue('Auth Feature');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Feature Title');

    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('New Feature Title')).toBeInTheDocument();
    });
    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
  });

  it('updates both ticket ID and title when both are edited', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    const ticketIdInput = screen.getByDisplayValue('PROJ-1');
    const titleInput = screen.getByDisplayValue('Auth Feature');

    await user.clear(ticketIdInput);
    await user.type(ticketIdInput, 'BUG-123');
    await user.clear(titleInput);
    await user.type(titleInput, 'Critical Bug Fix');

    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('BUG-123')).toBeInTheDocument();
      expect(screen.getByText('Critical Bug Fix')).toBeInTheDocument();
    });
  });

  it('converts ticket ID to uppercase when saving', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    const ticketIdInput = screen.getByDisplayValue('PROJ-1');
    await user.clear(ticketIdInput);
    await user.type(ticketIdInput, 'task-555');

    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('TASK-555')).toBeInTheDocument();
    });
  });

  it('cancels editing without saving changes', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    const ticketIdInput = screen.getByDisplayValue('PROJ-1');
    await user.clear(ticketIdInput);
    await user.type(ticketIdInput, 'TASK-999');

    const cancelButton = screen.getByRole('button', { name: /Cancel editing/i });
    await user.click(cancelButton);

    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    expect(screen.getByText('Auth Feature')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('TASK-999')).not.toBeInTheDocument();
  });

  it('exits edit mode after successful save', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    const titleInput = screen.getByDisplayValue('Auth Feature');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Save changes/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Cancel editing/i })).not.toBeInTheDocument();
    });

    expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    expect(screen.getByText('Updated Title')).toBeInTheDocument();
  });

  it('does not save when both fields are empty after clearing', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Auth Feature');
    });
    render(<TopBar />);

    const sessionDisplay = screen.getByRole('button', {
      name: /Click to edit: PROJ-1 — Auth Feature/i,
    });
    await user.click(sessionDisplay);

    const ticketIdInput = screen.getByDisplayValue('PROJ-1');
    const titleInput = screen.getByDisplayValue('Auth Feature');

    await user.clear(ticketIdInput);
    await user.clear(titleInput);

    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveButton);

    // Should still be in edit mode with empty inputs
    const emptyInputs = screen.getAllByDisplayValue('');
    expect(emptyInputs.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument();
  });
});

