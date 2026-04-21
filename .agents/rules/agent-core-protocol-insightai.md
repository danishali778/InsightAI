---
trigger: always_on
---

# Agent Core Protocol — InsightAI / QueryMind

These are the fundamental operating rules for this AI agent when working on the InsightAI (P9/QueryMind) project. These rules apply to EVERY message, EVERY task, without exception.

---

## RULE 1: PLAN BEFORE CODE — ALWAYS

**No exceptions.** Before writing, editing, or deleting a single line of code:

1. **Research first** — Read the relevant files. Understand the current state before proposing a future state.
2. **Write a plan** — Create or update `implementation_plan.md` as an artifact.
3. **Stop and wait** — Do NOT proceed to code until the user explicitly approves the plan.

**What counts as "approval"**: The user says "proceed", "do it", "yes", "go ahead" or equivalent.

**What does NOT count as approval**:
- The user asking a clarifying question
- Silence / no response
- Ambiguous acknowledgment like "okay interesting"

**Violation of this rule creates cascading failures.** The session history shows that every major regression (auth deadlock, floating input bar, startup crash) came from incremental changes made without a fully understood plan.

---

## RULE 2: SCOPE DISCIPLINE — ONLY TOUCH WHAT THE PLAN SAYS

When executing an approved plan:
- **Only modify files explicitly listed** in the implementation plan
- If a change requires touching an unlisted file → **STOP and update the plan first**
- Never "while I'm in here, I'll also fix..." — this is scope creep and causes regressions
- Each PR must be focused on ONE concern

---

## RULE 3: VERIFY AFTER EVERY CHANGE

After any code modification, always run the appropriate verification:

**Frontend changes**:
```bash
npx tsc --noEmit   # must exit code 0
```

**Backend changes**:
```bash
pytest tests/ -v -m "not integration"
```

**Full-stack changes**: Run both.

Never end a task without showing the user a clean verification result. If verification fails, fix it before declaring the task done.

---

## RULE 4: ONE CHANGE AT A TIME WHEN DEBUGGING

When the user reports a bug or error:
- Make ONE change
- Verify
- Report result
- Then make the next change if needed

Never batch multiple fixes for multiple suspected causes at once. This violates the scientific method and makes it impossible to know what actually fixed the problem.

---

## RULE 5: NEVER ASSUME — ALWAYS READ FIRST

Before claiming to know the current state of any file:
- **View the file** — never assume its contents from memory or context
- **If unsure which file** — `list_dir` to enumerate, then read
- **If error message is unclear** — read the full stack trace before forming a hypothesis

This project has evolved significantly across sessions. Muscle memory from earlier sessions is unreliable.

---

## RULE 6: RESPECT THE GITHUB WORKFLOW

Every code change must follow the branching rules in `github-rules.md`:
- Never push to `main` directly
- Always create a feature branch first: `feature/`, `fix/`, `chore/`
- Always create a PR — never merge directly
- PRs require: what changed, why, how to test

This is not optional even for "small" fixes.

---

## RULE 7: ACKNOWLEDGE UNCERTAINTY EXPLICITLY

If uncertain about:
- What caused an error → say "I suspect X but need to verify by reading Y"
- Whether a plan is complete → say "This plan covers A and B but I may be missing C — confirm?"
- Whether a fix will work → say "This addresses the most likely cause, but we should verify with Z"

Never present a guess as a certainty.

---

## RULE 8: PRESERVE EXISTING BEHAVIOR

When implementing new features or fixing bugs:
- The existing working functionality is sacred
- Any change that might affect existing behavior must be explicitly called out in the plan
- Tests must verify the existing behavior still works after the change

The phrase "while fixing X, I also changed Y" should never appear in a commit message.

---

## RULE 9: COMMUNICATE PROGRESS CLEARLY

During execution:
- After each step, report what was done and what comes next
- If blocked by an unexpected finding → STOP, report, ask
- Never silently skip a step or find a workaround without disclosing it
- The task.md artifact must be updated as steps complete

---

## RULE 10: ENVIRONMENT AWARENESS

This project runs on:
- **OS**: Windows (PowerShell) — paths use `\`, commands use PowerShell syntax
- **Backend**: Python 3.11 in a virtualenv at `backend/venv/`
- **Frontend**: Node.js 20, `npm` commands, Vite dev server at port 5173
- **Backend dev server**: uvicorn at port 8000
- **Database**: Supabase (PostgreSQL)

Always use the correct path separators and shell syntax for this environment.
