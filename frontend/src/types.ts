export type SnippetType = 'TEXT' | 'CODE' | 'IMAGE';

export interface Snippet {
  id: string; // UUIDv4
  timestamp: number; // Epoch ms
  type: SnippetType;
  content: string; // Raw text, markdown code, or base64 image data
}

export interface TicketSession {
  ticketId: string; // e.g., "PROJ-1234"
  title: string; // User-defined title
  snippets: Snippet[];
  summary: string | null; // Cached generated summary; null if not yet generated
  lastUpdated: number; // Epoch ms
}

export interface AppState {
  sessions: Record<string, TicketSession>;
  currentSessionId: string | null;
}

// Payload sent from Frontend -> Backend
export interface SummarizeRequest {
  ticketId: string;
  items: Omit<Snippet, 'id' | 'timestamp'>[];
}

export interface SummarizeResponse {
  summary: string;
}
