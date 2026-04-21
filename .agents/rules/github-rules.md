---
trigger: always_on
---

# Workspace Rules — InsightAI (P9 / QueryMind)

## Project Identity
- GitHub Repository: danishali778/InsightAI
- Default branch: main
- This is a text-to-SQL analytics SaaS (QueryMind/InsightAI)

## GitHub MCP Server Rules

### Branching Strategy
- NEVER push directly to `main`
- Always create a feature branch before making changes
- Branch naming: `<type>/<short-description>`
- **Allowed Types**: 
  - `feature/`: New functionality or major enhancements
  - `fix/`: Bug fixes
  - `hotfix/`: Urgent production fixes
  - `chore/`: Maintenance, setup, or sync tasks
  - `refactor/`: Code reorganization without behavior change
  - `perf/`: Performance improvements
  - `test/`: Adding or fixing tests
  - `docs/`: Documentation updates only
- Example: `feature/add-dashboard-widget`, `fix/sql-validation-error`, `chore/sync-local-state`

### Commits
- Write clear, descriptive commit messages
- Format: `<type>: <short description>`
- Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`
- Example: `feat: add pie chart widget to dashboard`

### Pull Requests
- Always create a PR to merge into `main` — never merge directly
- PR title must match the branch purpose
- PR description must include: what changed, why it changed, and how to test it

### File Push Rules
- Backend files live in: `backend/`
- Frontend files live in: `frontend/src/`
- Never push `.env` files or secrets to GitHub
- Never push `__pycache__`, `node_modules`, or build artifacts

### Issue Tracking
- Log all bugs as GitHub Issues before fixing them
- Label issues: `bug`, `enhancement`, `documentation`, `question`
- Reference issue number in commit messages when applicable: `fix: resolve SQL timeout (#12)`

### CLI vs MCP Protocol
- **Local Workspace Sync**: UNLESS there is no other option, always use the **Local Git CLI** (`run_command`) for `checkout`, `add`, `commit`, and `push`. This ensures the local `.git` state and file system remain synchronized with the remote repository.
- **Management & Coordination**: Use the **GitHub MCP Server** for high-level coordination tasks:
  - Creating Pull Requests (`create_pull_request`)
  - Managing Issues (`create_issue`, `add_issue_comment`)
  - Repository audits or searching code across the org.

### What Requires User Approval Before Pushing
- Any change to `main` branch
- Any new dependency (package.json or requirements.txt change)
- Any database migration file
- Any change to API contracts (routes, request/response models)
