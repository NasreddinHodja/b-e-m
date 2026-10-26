# B.E.M

Read first: `CONTRIBUTING.org` (setup, scripts, conventions, commits), then `docs/README.org` (architecture, one doc per view). Docs are Org, not Markdown.

## Rules

- The app is the SvelteKit code in `src/`. `legacy/index.html` is the old single-file app, kept as reference only: never edit it.
- Portuguese is the main language, English the second. Every visible string goes in both `messages/pt-br.json` and `messages/en.json`.
- Update the matching doc in `docs/` with the code. A visible change is also listed in `docs/parity.org`, "Changes since the port".
- Never push to `main`: it deploys to GitHub Pages. Work on a branch, open a PR, CI must pass.

## Before calling a change done

`pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`: all pass. `pnpm test:e2e` too when a page changed (Chromium setup: `CONTRIBUTING.org`, Tests).
