# AGENTS.md

Before doing any work in this repository, read `docs/workflow.md` and follow it strictly.

Hard rules (full detail in `docs/workflow.md`):

- Never commit directly to `main` or `development`. Check `git branch --show-current` before every commit.
- Never create branches from `main`. Branch from an up-to-date `development`.
- Branch names: `feature/US-XX-descriptive-name`, `fix/US-XX-...`, `docs/...`, `chore/...`.
- Every change goes through a Pull Request targeting `development`.
- Use Conventional Commits.
- Do not push, open PRs, or merge unless the user explicitly asks.
- Work is tracked in Trello (one card = one branch = one PR). If Trello or GitHub tools are unavailable, follow the fallback section of the workflow.
