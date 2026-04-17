# Identified Issues & Technical Debt - InsightAI (QueryMind)

This document outlines key areas for improvement, security hardening, and architectural refinement identified during codebase exploration.

## 🔴 Critical Severity

### 1. Plaintext Password Storage
**Location:** `backend/database/connection_manager.py`
**Description:** Database connection passwords are stored in plaintext within the `database_connections` table in Supabase.
**Risk:** If the Supabase database is compromised or an unauthorized user gains access to the service role key, all connected user databases are exposed.
**Remediation:** Implement AES-256 encryption for the `password` field before storing it in Supabase, using a server-side master key (e.g., via AWS KMS or HashiCorp Vault).

### 2. Soft Enforcement of Read-Only Queries
**Location:** `backend/query_executor/safety.py`
**Description:** Read-only enforcement relies on regex-based keyword blocking (`BLOCKED_KEYWORDS`).
**Risk:** Sophisticated SQL injection or specialized Postgres functions (e.g., `lo_import`, `dblink_exec`) might bypass regex filters.
**Remediation:**
- Enforce read-only status at the database level by using a read-only database user for executions.
- Use PostgreSQL-specific execution modes (`SET TRANSACTION READ ONLY`) for every session.

## 🟡 High Severity

### 3. Expensive Schema Re-inspection
**Location:** `backend/database/connection_manager.py` (`get_cached_schema`)
**Description:** Schema inspection (`schema_inspector.get_schema`) is performed frequently and involves multiple queries per table (column info, foreign keys, row counts).
**Risk:** High latency for large databases with hundreds of tables and potential performance impact on the target database.
**Remediation:**
- Implement a persistent schema cache in Supabase.
- Add a "Refresh Schema" button in the UI instead of auto-inspecting on every retrieval.
- Use asynchronous inspection tasks.

### 4. Lack of Automated Testing
**Description:** The repository lacks unit, integration, or end-to-end tests (no `tests/` directory or test configuration).
**Risk:** High risk of regressions during future feature development, especially in the LangGraph orchestration and SQL generation logic.
**Remediation:** Initialize a `pytest` suite in the backend and a Playwright/Vitest suite in the frontend.

## 🔵 Medium Severity

### 5. In-Memory Engine Cache (`_engines`)
**Location:** `backend/database/connection_manager.py`
**Description:** SQLAlchemy engines are cached in a global dictionary (`_engines`).
**Risk:** This state is lost on server restart and is not shared across multiple instances of the backend (e.g., in a containerized/load-balanced environment).
**Remediation:** Move towards a stateless design or use a shared connection pooler like PgBouncer if scaling horizontally.

### 6. Mock Auth in Production-ready Code
**Location:** `backend/common/auth.py`
**Description:** The system currently relies on a `MOCK_USER` for all operations.
**Risk:** Prevents multi-tenant usage and actual security enforcement.
**Remediation:** Integrate Supabase Auth JWT verification in the `get_current_user` dependency.
