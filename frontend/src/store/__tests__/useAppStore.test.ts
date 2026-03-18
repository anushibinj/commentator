import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { useAppStore } from '../../store/useAppStore';

// Reset store state before each test
beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
});

describe('useAppStore - session management', () => {
  it('creates a session and sets it as current', () => {
    let id = '';
    act(() => {
      id = useAppStore.getState().createSession('PROJ-1', 'Test Session');
    });
    const state = useAppStore.getState();
    expect(id!).toBeDefined();
    expect(state.sessions[id!]).toBeDefined();
    expect(state.sessions[id!].ticketId).toBe('PROJ-1');
    expect(state.sessions[id!].title).toBe('Test Session');
    expect(state.sessions[id!].summary).toBeNull();
    expect(state.currentSessionId).toBe(id!);
  });

  it('selects a session', () => {
    let id = '';
    act(() => {
      id = useAppStore.getState().createSession('PROJ-2', 'Another');
      useAppStore.getState().selectSession(id);
    });
    expect(useAppStore.getState().currentSessionId).toBe(id!);
  });

  it('deletes a session and falls back to another', () => {
    let id1 = '', id2 = '';
    act(() => {
      id1 = useAppStore.getState().createSession('PROJ-1', 'First');
      id2 = useAppStore.getState().createSession('PROJ-2', 'Second');
    });
    act(() => {
      useAppStore.getState().selectSession(id2);
      useAppStore.getState().deleteSession(id2);
    });
    const state = useAppStore.getState();
    expect(state.sessions[id2]).toBeUndefined();
    // After deleting current, falls back to another session
    expect(state.currentSessionId).toBe(id1);
  });

  it('deletes a non-current session without changing currentSessionId', () => {
    let id1 = '', id2 = '';
    act(() => {
      id1 = useAppStore.getState().createSession('PROJ-1', 'First');
      id2 = useAppStore.getState().createSession('PROJ-2', 'Second');
      useAppStore.getState().selectSession(id2);
    });
    act(() => {
      useAppStore.getState().deleteSession(id1);
    });
    const state = useAppStore.getState();
    expect(state.sessions[id1]).toBeUndefined();
    expect(state.currentSessionId).toBe(id2);
  });
});

describe('useAppStore - snippet management', () => {
  it('adds a snippet to a session', () => {
    let id: string;
    act(() => {
      id = useAppStore.getState().createSession('PROJ-3', 'Snippet Test');
      useAppStore.getState().addSnippet(id, 'TEXT', 'Hello world');
    });
    const session = useAppStore.getState().sessions[id!];
    expect(session.snippets).toHaveLength(1);
    expect(session.snippets[0].content).toBe('Hello world');
    expect(session.snippets[0].type).toBe('TEXT');
    expect(session.snippets[0].id).toBeDefined();
    expect(session.snippets[0].timestamp).toBeGreaterThan(0);
  });

  it('does nothing when adding snippet to non-existent session', () => {
    act(() => {
      useAppStore.getState().addSnippet('nonexistent-id', 'TEXT', 'test');
    });
    expect(useAppStore.getState().sessions).toEqual({});
  });

  it('deletes a snippet from a session', () => {
    let sessionId: string;
    act(() => {
      sessionId = useAppStore.getState().createSession('PROJ-4', 'Del Test');
      useAppStore.getState().addSnippet(sessionId, 'CODE', 'const x = 1;');
    });
    const snippetId = useAppStore.getState().sessions[sessionId!].snippets[0].id;
    act(() => {
      useAppStore.getState().deleteSnippet(sessionId!, snippetId);
    });
    expect(useAppStore.getState().sessions[sessionId!].snippets).toHaveLength(0);
  });

  it('does nothing when deleting snippet from non-existent session', () => {
    act(() => {
      useAppStore.getState().deleteSnippet('no-session', 'no-snippet');
    });
    expect(useAppStore.getState().sessions).toEqual({});
  });

  it('updates the content of an existing snippet', () => {
    let sessionId: string;
    act(() => {
      sessionId = useAppStore.getState().createSession('PROJ-6', 'Update Test');
      useAppStore.getState().addSnippet(sessionId, 'TEXT', 'original content');
    });
    const snippetId = useAppStore.getState().sessions[sessionId!].snippets[0].id;
    act(() => {
      useAppStore.getState().updateSnippet(sessionId!, snippetId, 'updated content');
    });
    const snippets = useAppStore.getState().sessions[sessionId!].snippets;
    expect(snippets[0].content).toBe('updated content');
  });

  it('does nothing when updating snippet in non-existent session', () => {
    act(() => {
      useAppStore.getState().updateSnippet('no-session', 'no-snippet', 'content');
    });
    expect(useAppStore.getState().sessions).toEqual({});
  });
});

describe('useAppStore - summary management', () => {
  it('updates the summary for a session', () => {
    let sessionId: string;
    act(() => {
      sessionId = useAppStore.getState().createSession('PROJ-7', 'Summary Test');
    });
    act(() => {
      useAppStore.getState().updateSessionSummary(sessionId!, 'This is the generated summary.');
    });
    const session = useAppStore.getState().sessions[sessionId!];
    expect(session.summary).toBe('This is the generated summary.');
  });

  it('does nothing when updating summary in non-existent session', () => {
    act(() => {
      useAppStore.getState().updateSessionSummary('no-session', 'summary');
    });
    expect(useAppStore.getState().sessions).toEqual({});
  });
});

describe('useAppStore - getCurrentSession', () => {
  it('returns null when no session is selected', () => {
    expect(useAppStore.getState().getCurrentSession()).toBeNull();
  });

  it('returns the current session when one is selected', () => {
    act(() => {
      useAppStore.getState().createSession('PROJ-5', 'Current');
    });
    const session = useAppStore.getState().getCurrentSession();
    expect(session?.ticketId).toBe('PROJ-5');
  });
});
