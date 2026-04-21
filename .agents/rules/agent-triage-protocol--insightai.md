---
trigger: always_on
---

# Agent Triage Protocol — InsightAI / QueryMind

These rules govern how this AI agent approaches ALL error reports, bugs, crashes, and unexpected behavior in the InsightAI project. Read and follow this protocol for EVERY error, no matter how obvious the fix seems.

---

## THE GOLDEN RULE OF TRIAGE

> **Never touch code until you understand the root cause.**

Fixing a symptom without understanding the cause is the #1 source of regressions. The session history shows this pattern: fix A → B breaks → fix B → A breaks again. The cycle only ends when root cause is identified.

---

## PHASE 1: INTAKE — Read Everything Before Acting

When the user reports an error, execute this checklist in order:

### 1.1 — Parse the Full Error Message
Read the ENTIRE error before doing anything. Identify:
- **Error type**: `TypeError`, `HTTPException`, `SyntaxError`, `ReferenceError`, etc.
- **Error location**: Which file, which line number
- **Error origin**: Is it frontend (browser console) or backend (terminal/log)?
- **Error timing**: Startup? On login? On a specific action? After a recent change?

### 1.2 — Identify the Error Layer

| Symptom | Likely Layer |
|---------|-------------|
| White screen / blank page | Frontend crash (React render error) |
| "Uncaught ReferenceError: X is not defined" | Frontend — missing import |
| "SyntaxError: Unexpected token" | Frontend — broken JSX/TSX |
| `status 500` / `Internal Server Error` | Backend — unhandled exception |
| `status 401` / `status 403` | Auth issue — JWT or permissions |
| `status 422` | FastAPI validation — request body mismatch |
| App hangs at login, never proceeds | Auth deadlock — `setLoading(false)` never called |
| Startup crash in terminal | Backend lifespan error |
| `CORS error` in browser | Backend CORS misconfiguration |

### 1.3 — Read the ACTUAL File Referenced in the Error

```
Error: at AddToDashboardModal (AddToDashboardModal.tsx:22:23)
→ view_file AddToDashboardModal.tsx — specifically around line 22
```

Never assume what the file contains. Always `view_file` before proposing a fix.

---

## PHASE 2: ROOT CAUSE ANALYSIS — The 3-Layer Hypothesis

Before proposing ANY fix, work through these 3 layers:

### Layer 1: Direct Cause (What is wrong?)
The literal thing the error message describes.
- Example: "useRef is not defined" → `useRef` is being called without import

### Layer 2: Contributing Cause (Why did it get into this state?)
The code change or condition that led to Layer 1.
- Example: The file's import block was modified and `useRef` was dropped

### Layer 3: Systemic Cause (Why wasn't this caught earlier?)
The process failure that allowed Layer 2 to happen.
- Example: TypeScript check wasn't run after the import was changed (`tsc` would have caught this)

**A fix is only complete when it addresses Layer 1 AND Layer 3.**
Fixing only Layer 1 means the same class of bug will recur.

---

## PHASE 3: DIAGNOSIS CHECKLIST FOR THIS PROJECT

Work through the most common root causes in this project before proposing anything:

### For Frontend Errors:
- [ ] Is there a missing React import? (`useState`, `useRef`, `useEffect` — all must be imported)
- [ ] Is there unclosed JSX? (check for `}` vs `}>` confusion in complex JSX blocks)
- [ ] Does `tsc --noEmit` pass? If not, there are real type errors
- [ ] Is the component being imported from the correct path?
- [ ] Was a prop removed or renamed without updating all usages?

### For Backend 500 Errors on Startup:
- [ ] Is there an `async` function in `lifespan()` that is NOT `await`-ed?
- [ ] Is `ALLOWED_ORIGINS` accidentally containing `"*"` (triggers the hard CORS guard)?
- [ ] Does `seed_dev_connection()` depend on a missing env var?
- [ ] Did a new router fail to import (check the import list in `main.py`)?

### For Auth / Login Failures:
- [ ] Do `VITE_DEV_MODE` and `BACKEND_DEV_MODE` match their intended state?
- [ ] Is the user a Mock User (zero UUID) hitting a Supabase write → FK violation?
- [ ] Is `setLoading(false)` inside a `try/catch` (if it's outside, any error will deadlock the app)?
- [ ] Is the backend returning 401 when it should return 500? (The frontend auto-signouts on 401)

### For 500 Errors on Specific API Calls:
- [ ] Is the Supabase call protected by `@supabase_retry` / `@async_supabase_retry`?
- [ ] Is there a foreign key constraint violation for the Mock User?
- [ ] Check the backend logs — the terminal/uvicorn output has the full Python traceback

---

## PHASE 4: FORM AND STATE A HYPOTHESIS

Before writing any code, explicitly state:

```
ROOT CAUSE HYPOTHESIS:
The error is caused by [SPECIFIC CAUSE] in [SPECIFIC FILE/LINE].
Evidence: [what in the error message or code supports this]
Confidence: [High / Medium / Low]

If I am wrong, the alternative cause could be: [ALTERNATIVE]
```

If confidence is **Low** → do more investigation before proposing a fix.
If confidence is **Medium or High** → propose ONE targeted fix.

---

## PHASE 5: THE FIX — Constraints

- **One change at a time** — fix the highest-confidence root cause first
- **Minimum surface area** — change as few lines as possible
- **Preserve existing behavior** — the fix must not change behavior in any other code path
- **Always verify** — run the appropriate check after the fix
- **Report the result** — "Fixed: tsc now passes" or "Fixed: the 500 error is resolved"

---

## PHASE 6: POST-FIX — Prevent Recurrence

After fixing any bug, always ask:
1. "What would have caught this earlier?" → Add a note or improvement to the CI/quality rules
2. "Is this same pattern used elsewhere?" → Check if similar code has the same latent bug
3. "Should a test be added here?" → If yes, propose it

---

## Anti-Patterns — Never Do These

| ❌ Anti-Pattern | ✅ Instead |
|---|---|
| "This looks like it might be X, let me try changing it" | State a hypothesis first, get validation, then change |
| Batch-fixing 3 possible causes at once | Fix one cause, verify, then fix the next |
| Assuming file contents from memory | `view_file` the actual file first |
| "The error is obvious, fixing it now" | Still run the 3-layer analysis — the obvious fix is often wrong |
| Fixing the error but not the process that caused it | Address Layer 3 (systemic cause) too |
