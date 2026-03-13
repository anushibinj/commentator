import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { useAppStore } from './useAppStore';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
});

describe('useAppStore', () => {
  describe('createSession', () => {
    it('creates a new session with the given ticket ID and title', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      const state = useAppStore.getState();
      expect(state.sessions[sessionId!]).toBeDefined();
      expect(state.sessions[sessionId!].ticketId).toBe('PROJ-1');
      expect(state.sessions[sessionId!].title).toBe('My Task');
      expect(state.currentSessionId).toBe(sessionId);
    });
  });

  describe('updateSession', () => {
    it('updates ticket ID of a session', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      act(() => {
        useAppStore.getState().updateSession(sessionId!, 'TASK-999');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.ticketId).toBe('TASK-999');
      expect(session.title).toBe('My Task');
    });

    it('updates title of a session', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      act(() => {
        useAppStore.getState().updateSession(sessionId!, undefined, 'Updated Title');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.ticketId).toBe('PROJ-1');
      expect(session.title).toBe('Updated Title');
    });

    it('updates both ticket ID and title', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      act(() => {
        useAppStore.getState().updateSession(sessionId!, 'BUG-123', 'Critical Bug');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.ticketId).toBe('BUG-123');
      expect(session.title).toBe('Critical Bug');
    });

    it('updates lastUpdated timestamp when session is updated', () => {
      let sessionId: string;
      let originalTimestamp: number;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        originalTimestamp = useAppStore.getState().sessions[sessionId!].lastUpdated;
      });

      // Small delay to ensure timestamp is different
      const delay = () => new Promise((resolve) => setTimeout(resolve, 1));
      act(() => {
        useAppStore.getState().updateSession(sessionId!, 'TASK-999');
      });
      delay();

      const newTimestamp = useAppStore.getState().sessions[sessionId!].lastUpdated;
      expect(newTimestamp).toBeGreaterThanOrEqual(originalTimestamp);
    });

    it('does not update other session properties when updating ticket ID or title', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        useAppStore.getState().addSnippet(sessionId!, 'TEXT', 'Some content');
      });

      const snippetsBefore = useAppStore.getState().sessions[sessionId!].snippets.length;

      act(() => {
        useAppStore.getState().updateSession(sessionId!, 'TASK-999', 'Updated');
      });

      const snippetsAfter = useAppStore.getState().sessions[sessionId!].snippets.length;
      expect(snippetsAfter).toBe(snippetsBefore);
    });

    it('does nothing if session does not exist', () => {
      const stateBefore = useAppStore.getState().sessions;
      act(() => {
        useAppStore.getState().updateSession('nonexistent', 'TASK-999');
      });

      expect(useAppStore.getState().sessions).toEqual(stateBefore);
    });

    it('keeps original value if undefined is passed for ticket ID', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      act(() => {
        useAppStore.getState().updateSession(sessionId!, undefined, 'Updated Title');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.ticketId).toBe('PROJ-1');
    });

    it('keeps original value if undefined is passed for title', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      act(() => {
        useAppStore.getState().updateSession(sessionId!, 'TASK-999');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.title).toBe('My Task');
    });
  });

  describe('addSnippet', () => {
    it('adds a snippet to a session', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        useAppStore.getState().addSnippet(sessionId!, 'TEXT', 'Some content');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.snippets.length).toBe(1);
      expect(session.snippets[0].type).toBe('TEXT');
      expect(session.snippets[0].content).toBe('Some content');
    });
  });

  describe('deleteSnippet', () => {
    it('removes a snippet from a session', () => {
      let sessionId: string;
      let snippetId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        useAppStore.getState().addSnippet(sessionId!, 'TEXT', 'Content 1');
        useAppStore.getState().addSnippet(sessionId!, 'TEXT', 'Content 2');
      });

      snippetId = useAppStore.getState().sessions[sessionId!].snippets[0].id;

      act(() => {
        useAppStore.getState().deleteSnippet(sessionId!, snippetId);
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.snippets.length).toBe(1);
      expect(session.snippets[0].content).toBe('Content 2');
    });
  });

  describe('updateSnippet', () => {
    it('updates a snippet content', () => {
      let sessionId: string;
      let snippetId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        useAppStore.getState().addSnippet(sessionId!, 'TEXT', 'Original content');
      });

      snippetId = useAppStore.getState().sessions[sessionId!].snippets[0].id;

      act(() => {
        useAppStore.getState().updateSnippet(sessionId!, snippetId, 'Updated content');
      });

      const snippet = useAppStore.getState().sessions[sessionId!].snippets[0];
      expect(snippet.content).toBe('Updated content');
    });
  });

  describe('selectSession', () => {
    it('sets the current session ID', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        useAppStore.getState().selectSession('other');
      });

      expect(useAppStore.getState().currentSessionId).toBe('other');
    });
  });

  describe('deleteSession', () => {
    it('removes a session from the store', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      expect(useAppStore.getState().sessions[sessionId!]).toBeDefined();

      act(() => {
        useAppStore.getState().deleteSession(sessionId!);
      });

      expect(useAppStore.getState().sessions[sessionId!]).toBeUndefined();
    });

    it('clears current session ID if deleted session was active', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      expect(useAppStore.getState().currentSessionId).toBe(sessionId);

      act(() => {
        useAppStore.getState().deleteSession(sessionId!);
      });

      expect(useAppStore.getState().currentSessionId).toBeNull();
    });
  });

  describe('updateSessionSummary', () => {
    it('updates the summary of a session', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        useAppStore
          .getState()
          .updateSessionSummary(sessionId!, 'Generated summary');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.summary).toBe('Generated summary');
    });

    it('does NOT bump lastUpdated when saving a summary', () => {
      let sessionId: string;
      let lastUpdatedAfterSnippet: number;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
        useAppStore.getState().addSnippet(sessionId!, 'TEXT', 'Some work');
        lastUpdatedAfterSnippet = useAppStore.getState().sessions[sessionId!].lastUpdated;
      });

      act(() => {
        useAppStore.getState().updateSessionSummary(sessionId!, 'Generated summary');
      });

      const session = useAppStore.getState().sessions[sessionId!];
      expect(session.lastUpdated).toBe(lastUpdatedAfterSnippet!);
    });
  });

  describe('getCurrentSession', () => {
    it('returns the current session', () => {
      let sessionId: string;
      act(() => {
        sessionId = useAppStore.getState().createSession('PROJ-1', 'My Task');
      });

      const session = useAppStore.getState().getCurrentSession();
      expect(session?.ticketId).toBe('PROJ-1');
      expect(session?.title).toBe('My Task');
    });

    it('returns null if no session is active', () => {
      const session = useAppStore.getState().getCurrentSession();
      expect(session).toBeNull();
    });
  });
});
