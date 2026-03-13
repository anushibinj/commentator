# Commentator

A web-based internal developer utility that acts as a chronological, append-only scratchpad for daily work sessions. Paste text, code snippets, and screenshots into session-specific buckets, then generate a polished work log narrative suitable for any ticketing system — powered by a multimodal LLM.

All session data lives entirely in your browser (IndexedDB). The backend is stateless and acts only as a prompt-assembly and LLM proxy layer.

---

## Architecture

```
browser (React + Zustand + IndexedDB)
        │
        │  POST /api/summarize
        ▼
Spring Boot (stateless proxy)
        │
        │  OpenAI-compatible API
        ▼
Multimodal LLM (OpenAI / Ollama / llava / etc.)
```

| Layer | Tech |
|---|---|
| Frontend | Vite 8, React 19, TypeScript, Tailwind CSS 4 |
| State & storage | Zustand 5 + localforage (IndexedDB) |
| Backend | Spring Boot 3.4, Spring AI 1.0 |
| LLM | Any OpenAI-compatible multimodal endpoint |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Java 21+
- Maven 3.9+
- A running OpenAI-compatible LLM endpoint (see [LLM configuration](#llm-configuration))

### 1. Backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`.

### 2. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

The app starts on `http://localhost:5173`.

> **Note:** `--legacy-peer-deps` is required because `@tailwindcss/vite` 4.x declares a peer dependency on Vite ≤7, while this project uses Vite 8. The flag is also persisted in `frontend/.npmrc` so plain `npm install` works too.

---

## LLM Configuration

The backend reads three environment variables at startup:

| Variable | Default | Description |
|---|---|---|
| `OPENAI_BASE_URL` | `http://localhost:11434/v1` | Base URL of the OpenAI-compatible endpoint |
| `OPENAI_API_KEY` | `ollama` | API key (use any non-empty string for Ollama) |
| `OPENAI_MODEL` | `llava` | Model name to request |

**Ollama (local, default):**
```bash
ollama pull llava
cd backend && mvn spring-boot:run
```

**OpenAI:**
```bash
OPENAI_BASE_URL=https://api.openai.com \
OPENAI_API_KEY=sk-... \
OPENAI_MODEL=gpt-4o \
mvn spring-boot:run
```

---

## Usage

1. **Create a session** — click "New Session" in the sidebar, enter a ticket ID (e.g. `PROJ-1234`) and a title.
2. **Add content** — paste anything into the app:
   - Plain text or notes → stored as **TEXT**
   - Code or stack traces → auto-detected and stored as **CODE**
   - Screenshots → compressed to max 1024px / JPEG 0.75 and stored as **IMAGE**
   - Or type directly into the input panel at the bottom.
3. **Generate summary** — the app automatically generates a summary whenever you add content. The app sends all snippets to the backend, which assembles a multimodal prompt and returns a single narrative paragraph suitable for your ticketing system.
4. **Copy to clipboard** — copy the generated summary directly from the summary pane.

---

## Project Structure

```
commentator/
├── frontend/                        # Vite + React + TypeScript
│   └── src/
│       ├── api/                     # Backend fetch wrapper
│       ├── components/              # UI components
│       ├── hooks/                   # useGlobalPaste
│       ├── store/                   # Zustand + IndexedDB store
│       ├── utils/                   # Image compression, text truncation
│       └── types.ts                 # Shared TypeScript contracts
│
└── backend/                         # Spring Boot stateless proxy
    └── src/main/java/com/commentator/backend/
        ├── controller/              # POST /api/summarize
        ├── model/                   # Request/response records
        └── service/                 # Prompt assembly + ChatClient
```

---

## Running Tests

**Frontend** (Vitest + React Testing Library):
```bash
cd frontend
npm run test:run          # run once
npm run test              # watch mode
npm run test:coverage     # with coverage report
```

**Backend** (JUnit 5 + Mockito):
```bash
cd backend
mvn test
```
