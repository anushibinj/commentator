import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { TextInputPanel } from '../../components/TextInputPanel';
import { useAppStore } from '../../store/useAppStore';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
});

describe('TextInputPanel', () => {
  it('renders the textarea and type selector', () => {
    render(<TextInputPanel sessionId="test-session" />);
    expect(screen.getByPlaceholderText('Type a note or paste text here...')).toBeInTheDocument();
    expect(screen.getByLabelText('Snippet type')).toBeInTheDocument();
  });

  it('disables the add button when textarea is empty', () => {
    render(<TextInputPanel sessionId="test-session" />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('enables the add button when text is entered', () => {
    render(<TextInputPanel sessionId="test-session" />);
    fireEvent.change(screen.getByPlaceholderText('Type a note or paste text here...'), {
      target: { value: 'Some text' },
    });
    expect(screen.getByRole('button', { name: 'Add' })).not.toBeDisabled();
  });

  it('adds a TEXT snippet on form submit', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    render(<TextInputPanel sessionId={sessionId} />);

    fireEvent.change(screen.getByPlaceholderText('Type a note or paste text here...'), {
      target: { value: 'My note' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const snippets = useAppStore.getState().sessions[sessionId].snippets;
    expect(snippets).toHaveLength(1);
    expect(snippets[0].content).toBe('My note');
    expect(snippets[0].type).toBe('TEXT');
  });

  it('adds a CODE snippet when CODE type is selected', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    render(<TextInputPanel sessionId={sessionId} />);

    fireEvent.change(screen.getByLabelText('Snippet type'), { target: { value: 'CODE' } });
    fireEvent.change(screen.getByPlaceholderText('Type a note or paste text here...'), {
      target: { value: 'const x = 1;' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    const snippets = useAppStore.getState().sessions[sessionId].snippets;
    expect(snippets[0].type).toBe('CODE');
  });

  it('clears textarea after submission', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    render(<TextInputPanel sessionId={sessionId} />);
    const textarea = screen.getByPlaceholderText('Type a note or paste text here...');
    fireEvent.change(textarea, { target: { value: 'My note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('submits on Ctrl+Enter', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    render(<TextInputPanel sessionId={sessionId} />);
    const textarea = screen.getByPlaceholderText('Type a note or paste text here...');
    fireEvent.change(textarea, { target: { value: 'Ctrl enter note' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    const snippets = useAppStore.getState().sessions[sessionId].snippets;
    expect(snippets).toHaveLength(1);
  });
});
