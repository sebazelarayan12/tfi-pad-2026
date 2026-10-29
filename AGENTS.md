# AGENTS.md

Before doing any work in this repository, read `docs/workflow.md` and follow it strictly.

Hard rules (full detail in `docs/workflow.md`):

- Never commit directly to `main` or `development`. Check `git branch --show-current` before every commit.
- Never create branches from `main`. Branch from an up-to-date `development`.
- Branch names: `feature/US-XX-descriptive-name`, `fix/US-XX-...`, `docs/...`, `chore/...`.
- Every change goes through a Pull Request targeting `development`.
- Use Conventional Commits.
- Never hardcode secrets, passwords, API keys, tokens or connection strings with credentials in code, config files, Dockerfiles or compose files. Read them from environment variables (`.env`, never committed) and commit only a `.env.example` with fake placeholder values.
- Do not push, open PRs, or merge unless the user explicitly asks.
- Trello cards are short summaries; the source of truth for each task is its section in `docs/tareas-divididas.md` (cards are named `US-F1-01`, `US-T-02`, etc.). Before starting a card, read its whole section there (scope, "Puede empezar sin esperar a", pending decisions). A task is ready only when every acceptance criterion in that section is met; verify them one by one against the code before opening the PR or moving the card to QA. If the card and the document disagree, the document wins.
- Team skills are listed in the "Skills del equipo" section of `docs/workflow.md`. Check that table only when the current task touches a listed skill's area (not at session start), and compare it against the skills already available in your context. If the skill is missing, recommend it once, with its `npx skills add <repo>` command and why it helps; if it is installed, say nothing. When you use a language/framework skill that is not in the table, add it there.
- Work is tracked in Trello (one card = one branch = one PR). If Trello or GitHub tools are unavailable, follow the fallback section of the workflow.
