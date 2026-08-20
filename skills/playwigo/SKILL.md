---
name: playwigo
description: Manages Playwigo E2E tests via the Playwigo CLI — projects, features, test cases, steps, and remote test runs. Use when the user mentions Playwigo, @playwigo/cli, creating or running Playwigo test cases, or writing Playwigo steps.
---

# Playwigo

Playwigo stores Playwright-style E2E tests in the cloud. The CLI talks to a Playwigo deployment; test execution always runs on Playwigo (Cloudflare Browser Run), never in this repo.

Prefer the CLI over raw REST. Always pass `--json`. Parse stdout as `{ "data": ... }`.

## Setup

Need Node.js 20+, `@playwigo/cli`, and the user’s own credentials:

```bash
npm install -g @playwigo/cli   # or: npx @playwigo/cli …

export PLAYWIGO_API_KEY="sk-pwg-..."
```

- API keys come from **Settings → API Keys** in the Playwigo app. Prefix is `sk-pwg-`.
- The CLI defaults to `https://playwigo.monolabs.workers.dev`. Do not set `PLAYWIGO_API_URL` unless the user asks to target a different deployment.
- Never invent, print, or commit an API key. If `PLAYWIGO_API_KEY` is missing, stop and ask the user to export one.
- A key is a full session. Treat it like a password.

Confirm with `playwigo projects list --json` before mutating anything.

## Domain

```text
project → feature → test case → ordered steps
                 ↘ test accounts + login flows (web UI only)
```

- **Project**: the product under test (website URL lives here). There is no CLI to create projects — do that in the app.
- **Feature**: a capability (Checkout, Auth). Create these via CLI.
- **Test case**: one scenario. Name it after user intent (`Guest can check out with a saved card`), not implementation (`click-submit-btn`).
- **Steps**: ordered Playwright actions. `steps set` **replaces** the full list.
- **Test account + login flow**: how the case authenticates. Create and wire these in the Playwigo UI, then pass `--test-account <id>` when creating the case. Do **not** guess login fields or invent a fill/click login sequence.

## Default workflow

1. `playwigo projects list --json` — pick the project (ask if more than one).
2. `playwigo features list --project <id> --json` — reuse an existing feature, or `features create`.
3. `playwigo test-cases create --feature <id> --name "…" --test-account <id> --json` when the user has an account id; omit `--test-account` only for unauthenticated flows.
4. Write `steps.json` (see [references/steps.md](references/steps.md)).
5. `playwigo steps set --test-case <id> --file steps.json --json`
6. `playwigo run --test-case <id> --wait --json` — exit `1` means the run failed. Pass `--var key=value` for dynamic data (OTP endpoint, mailbox key, etc.).

```bash
PROJECT_ID=$(playwigo projects list --json | jq -r '.data[0].id')
FEATURE_ID=$(playwigo features create --project "$PROJECT_ID" --name "Checkout" --json | jq -r '.data.id')
CASE_ID=$(playwigo test-cases create --feature "$FEATURE_ID" --name "Guest can check out" --json | jq -r '.data.id')
playwigo steps set --test-case "$CASE_ID" --file ./steps.json --json
playwigo run --test-case "$CASE_ID" --wait --json
```

## Dynamic data

- Prefer `{{$email}}` / `{{$uuid}}` for unique per-run values (registration).
- Prefer `httpRequest` / `extractText` steps to produce OTP and similar values inside the run.
- Prefer `--var` when the agent already has a value (or a secret) before starting the browser.
- Do **not** invent mid-run interactive pauses; Playwigo runs are non-interactive today.

See [references/steps.md](references/steps.md) for the full template and action reference.

- Use `--json` on every command. Human output is not a stable contract.
- Do not invent CSS selectors, test-account IDs, or URLs the user did not provide. Ask, or list existing cases/features first.
- Element picking exists only in the Playwigo **browser extension**. If the user wants to click-to-select a DOM node here, tell them that — do not try to pick elements from this agent session.
- Do not run Playwright locally as a substitute for `playwigo run`.
- Do not call `/api/v1` with curl unless the CLI cannot express the request (today it covers the agent surface).
- CLI cannot manage test accounts, login flows, or projects. Point the user at the web app for those.

## Failures

| Exit | Meaning |
| --- | --- |
| 0 | Success |
| 1 | API / business error, including a failed `--wait` run |
| 2 | Usage (missing env, bad args) |

On a failed run, read `data.status`, `data.errorMessage`, and failed `data.steps[]`. Fix the steps (or the missing test account), `steps set` again, re-run. Do not loop more than twice without asking.

## References

- Command list: [references/cli.md](references/cli.md)
- Step schema and examples: [references/steps.md](references/steps.md)
