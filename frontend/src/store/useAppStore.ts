import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Snippet, SnippetType, TicketSession } from '../types';

// Configure localforage to use IndexedDB
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'commentator',
  storeName: 'app_state',
});

// Adapter to make localforage work with Zustand persist middleware
const localforageStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await localforage.getItem<string>(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

interface AppStore extends AppState {
  // Session actions
  createSession: (ticketId: string, title: string) => string;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSession: (sessionId: string, ticketId?: string, title?: string) => void;
  // Snippet actions
  addSnippet: (sessionId: string, type: SnippetType, content: string) => void;
  updateSnippet: (sessionId: string, snippetId: string, content: string) => void;
  deleteSnippet: (sessionId: string, snippetId: string) => void;
  // Summary actions
  updateSessionSummary: (sessionId: string, summary: string) => void;
  // Current session helpers
  getCurrentSession: () => TicketSession | null;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      currentSessionId: null,

      createSession: (ticketId: string, title: string): string => {
        const sessionId = uuidv4();
        const session: TicketSession = {
          ticketId,
          title,
          snippets: [],
          summary: null,
          lastUpdated: Date.now(),
        };
        set((state) => ({
          sessions: { ...state.sessions, [sessionId]: session },
          currentSessionId: sessionId,
        }));
        return sessionId;
      },

      selectSession: (sessionId: string): void => {
        set({ currentSessionId: sessionId });
      },

      deleteSession: (sessionId: string): void => {
        set((state) => {
          const { [sessionId]: _removed, ...remaining } = state.sessions;
          const currentSessionId =
            state.currentSessionId === sessionId
              ? (Object.keys(remaining)[0] ?? null)
              : state.currentSessionId;
          return { sessions: remaining, currentSessionId };
        });
      },

      updateSession: (sessionId: string, ticketId?: string, title?: string): void => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                ticketId: ticketId ?? session.ticketId,
                title: title ?? session.title,
                lastUpdated: Date.now(),
              },
            },
          };
        });
      },

      addSnippet: (sessionId: string, type: SnippetType, content: string): void => {
        const snippet: Snippet = {
          id: uuidv4(),
          timestamp: Date.now(),
          type,
          content,
        };
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                snippets: [...session.snippets, snippet],
                lastUpdated: Date.now(),
              },
            },
          };
        });
      },

      updateSnippet: (sessionId: string, snippetId: string, content: string): void => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                snippets: session.snippets.map((s) =>
                  s.id === snippetId ? { ...s, content } : s,
                ),
                lastUpdated: Date.now(),
              },
            },
          };
        });
      },

      deleteSnippet: (sessionId: string, snippetId: string): void => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                snippets: session.snippets.filter((s) => s.id !== snippetId),
                lastUpdated: Date.now(),
              },
            },
          };
        });
      },

      getCurrentSession: (): TicketSession | null => {
        const { sessions, currentSessionId } = get();
        if (!currentSessionId) return null;
        return sessions[currentSessionId] ?? null;
      },

      updateSessionSummary: (sessionId: string, summary: string): void => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                summary,
                // Do NOT bump lastUpdated here — saving a generated summary is not a
                // user content change. Bumping it would re-trigger the auto-generate
                // effect and cause an infinite regeneration loop.
              },
            },
          };
        });
      },
    }),
    {
      name: 'commentator-storage',
      storage: createJSONStorage(() => localforageStorage),
    },
  ),
);
