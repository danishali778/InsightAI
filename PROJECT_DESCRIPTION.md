# QueryMind Project Description

## Product Summary

QueryMind is a text-to-SQL analytics application for exploring relational databases through a chat interface. A user connects a database, asks a question in plain language, receives generated SQL and query results, and can promote useful results into a saved query library or dashboard widgets.

The current repository is organized around feature modules:

- `backend/ai_core`: prompt building, chat/session models, SQL generation, orchestration
- `backend/database`: connection management, schema inspection, database contracts
- `backend/query_executor`: query validation and execution
- `backend/query_history`: query activity records and stats
- `backend/query_library`: saved query models and library behavior
- `backend/dashboard`: dashboard and widget models/store behavior
- `backend/routers`: API endpoints mapped to those feature modules
- `frontend/src/pages`: top-level application screens
- `frontend/src/components`: feature-specific UI
- `frontend/src/services`: API access and HTTP utilities
- `frontend/src/types`: shared frontend contracts

## Current Workflow

The main Phase 1 product workflow is:

1. Create or select a database connection.
2. Open the chat screen and ask a question.
3. The backend builds schema context and recent conversation context.
4. The LLM generates SQL.
5. The backend validates the SQL as read-only.
6. The query executes with row limits and timeout handling.
7. The UI shows explanation, SQL, result rows, and a chart recommendation.
8. The result can be saved to the query library.
9. The result can be added to a dashboard as a widget.
10. The saved query or dashboard widget can be revisited later in the same running app session.

## Phase 1 Scope

Phase 1 is focused on workflow stability and contract consistency, not yet on full persistence or authentication.

Phase 1 includes:

- Stable API request and response contracts
- Shared frontend types for backend payloads
- Consistent frontend HTTP error handling
- Environment-based frontend API configuration
- Defined screen-level workflows for chat, connections, library, and dashboard
- Clean modular structure aligned with the existing backend domains

Phase 1 intentionally does not yet include:

- User authentication and authorization
- Multi-tenant ownership rules
- Persistent application state in a dedicated app database
- Collaboration, sharing permissions, or audit history

## Backend Design

The backend uses FastAPI as the API layer and keeps domain logic separated by module. The chat workflow is orchestrated in `backend/ai_core/graph.py`:

1. Build schema context from the selected connection.
2. Build a prompt from schema and recent session history.
3. Generate SQL from the LLM.
4. Validate the SQL for safety.
5. Execute the SQL with limits.
6. Analyze the result shape.
7. Produce an optional chart recommendation.
8. Retry on certain failures by feeding execution errors back into the LLM.

The backend now exposes explicit response models for the Phase 1 workflow and returns normalized error payloads through shared exception handlers in `backend/common`.

## Frontend Design

The frontend is a React + Vite application with screen-level state inside `pages` and reusable UI inside `components`.

Phase 1 frontend standards are:

- Shared API contracts live in `frontend/src/types/api.ts`
- HTTP request behavior is centralized in `frontend/src/services/http.ts`
- Feature APIs are centralized in `frontend/src/services/api.ts`
- Runtime API base URL is configured through `VITE_API_BASE_URL`

## Known Current Limits

The product workflow is now standardized, but some enterprise capabilities are still intentionally deferred:

- Connections, sessions, dashboards, query history, and library items are still stored in memory on the backend.
- A backend restart clears that application state.
- Auth, ownership, and permanent app persistence are later phases.

## Next Phase Direction

After Phase 1, the next major work should focus on:

- hardening the chat-to-SQL workflow
- improving query safety and observability
- completing richer workflow behavior around saved queries and dashboards
- introducing persistence and auth on top of the stable contracts now in place
