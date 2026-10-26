# CLAUDE.md

This project follows a mandatory team workflow. Read and respect it before any task:

@docs/workflow.md

Never commit to `main` or `development` directly; always work on a branch created from `development` and open PRs against `development`. Check `git branch --show-current` before every commit.

Trello cards are short summaries. The source of truth for each task is its section in `docs/tareas-divididas.md` (cards are named `US-F1-01`, `US-T-02`, etc.). Before starting a card, read its whole section there (scope, "Puede empezar sin esperar a", pending decisions). A task is ready only when every acceptance criterion in that section is met; verify them one by one against the code before opening the PR or moving the card to QA. If the card and the document disagree, the document wins.

Never hardcode secrets, passwords, API keys, tokens or connection strings with credentials in code, config files, Dockerfiles or compose files. Read them from environment variables (`.env`, never committed) and commit only a `.env.example` with fake placeholder values.
