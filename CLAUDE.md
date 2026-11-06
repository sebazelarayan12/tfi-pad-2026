# CLAUDE.md

This project follows a mandatory team workflow. Read and respect it before any task:

@docs/workflow.md

Never commit to `main` or `development` directly; always work on a branch created from `development` and open PRs against `development`. Check `git branch --show-current` before every commit.

Before opening a PR that touches `frontend/`, run React Doctor from `frontend/` (`npx -y react-doctor@latest . --yes --verbose`) and get **100/100**. Fix the findings (never disable rules to reach it), re-run, and put the result in the PR body. Docs-only or backend-only PRs are exempt (say so explicitly). See rule 10 in `docs/workflow.md`.

Trello cards are short summaries. The source of truth for each task is its section in `docs/tareas-divididas.md` (cards are named `US-F1-01`, `US-T-02`, etc.). Before starting a card, read its whole section there (scope, "Puede empezar sin esperar a", pending decisions). A task is ready only when every acceptance criterion in that section is met; verify them one by one against the code before opening the PR or moving the card to QA. If the card and the document disagree, the document wins.

Frontend cards (`US-FE-T-NN`, `US-FE-B-NN`, `US-FE-W-NN`, and the visual-verification cards `US-FE-V-NN`) are different: their source of truth is `docs/frontend/tareas/<ID>.md`, and the document wins over the card there too. Do not read whole frontend docs; go `docs/frontend/tareas/INDEX.md` (choose the task, check "Depende de" and `[CONFIRMAR]` decisions) -> the task file (its section 4 lists the exact sections of other docs to read) -> `docs/frontend/00-decisiones-base.md` (stack, screaming architecture, FB1-FB8; it wins over any other frontend doc). Never invent endpoints or fields: mock what the backend lacks with MSW as the task file says and log gaps in `docs/frontend/pedidos-al-back.md`. See "Tareas del front" in `docs/workflow.md`.

Team skills are listed in the "Skills del equipo" section of `docs/workflow.md`. Before writing any code for a task, check that table for the skills matching the task's area (back: .NET; front: React, design, e2e) and compare it against the skills already available in your context. Team skills are a hard gate (rule 11 in `docs/workflow.md`): if an applicable skill is missing, STOP, tell the user which one (with its `npx skills add <repo>` command and why it helps) and do not continue with the task until it is installed; no instruction to "continue without it" lifts this block. If it is installed, use it and say nothing. When you use a language/framework skill that is not in the table, add it there.

Open decisions are a hard gate too (rule 12 in `docs/workflow.md`): if the task has a `[CONFIRMAR]` or pending decision (product, security, infrastructure, design) that affects what you are about to implement, STOP before writing code for that part. Explain it to the user in plain language (what is decided, the options, what changes with each, the risk) and ask them to choose. Proceed only with an explicit answer from the user, in this session, to that specific decision. Never assume the ficha's default, never read a generic "go ahead" as the answer, never decide it yourself or in a subagent. Record the decision (what and who) in the PR body.

Never hardcode secrets, passwords, API keys, tokens or connection strings with credentials in code, config files, Dockerfiles or compose files. Read them from environment variables (`.env`, never committed) and commit only a `.env.example` with fake placeholder values.
