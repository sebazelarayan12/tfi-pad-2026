# CLAUDE.md

This project follows a mandatory team workflow. Read and respect it before any task:

@docs/workflow.md

Never commit to `main` or `development` directly; always work on a branch created from `development` and open PRs against `development`. Check `git branch --show-current` before every commit.

Never hardcode secrets, passwords, API keys, tokens or connection strings with credentials in code, config files, Dockerfiles or compose files. Read them from environment variables (`.env`, never committed) and commit only a `.env.example` with fake placeholder values.
