# Playwigo CLI

Thin HTTP client for AI agents to manage Playwigo projects, features, test cases, steps, and test runs via the deployed API.

## Install (users)

Requires Node.js 20+.

```bash
npm install -g @playwigo/cli
# or
pnpm add -g @playwigo/cli
# or one-off
npx @playwigo/cli --help
```

Then configure:

```bash
export PLAYWIGO_API_URL="https://your-playwigo-deployment.example"
export PLAYWIGO_API_KEY="sk-pwg-..."
```

Create an API key in the Playwigo web app under **Settings → API Keys**. Keys use the `sk-pwg-` prefix.

```bash
playwigo projects list --json
```

Local development default URL is `http://localhost:3000` when `PLAYWIGO_API_URL` is unset.

## Authentication

Requests send the key as:

```http
x-api-key: sk-pwg-...
```

Do not commit API keys. Rotate leaked keys immediately — with `enableSessionForAPIKeys`, a key is equivalent to a full user session.

## Commands

All commands support `--json` for stable agent-friendly output.

```bash
playwigo projects list --json

playwigo features list --project <id> --json
playwigo features create --project <id> --name "Checkout" --json

playwigo test-cases list --feature <id> --json
playwigo test-cases create --feature <id> --name "Happy path" --json

playwigo steps get --test-case <id> --json
playwigo steps set --test-case <id> --file steps.json --json

playwigo run --test-case <id> --json
playwigo run --test-case <id> --wait --json
playwigo run wait --run <id> --json

playwigo runs list --project <id> --json
```

### Steps file format

`steps.json` may be either:

```json
{
  "steps": [
    {
      "action": "goto",
      "value": "https://example.com"
    },
    {
      "action": "click",
      "selectorType": "role",
      "selector": "button[name='Submit']"
    }
  ]
}
```

or a bare array of step objects.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | API / business error (including failed test run when using `--wait`) |
| 2 | Usage error (missing env, bad args) |

## Agent workflow example

```bash
export PLAYWIGO_API_URL="https://your-playwigo-deployment.example"
export PLAYWIGO_API_KEY="sk-pwg-..."

PROJECT_ID=$(playwigo projects list --json | jq -r '.data[0].id')
FEATURE_ID=$(playwigo features create --project "$PROJECT_ID" --name "Auth" --json | jq -r '.data.id')
CASE_ID=$(playwigo test-cases create --feature "$FEATURE_ID" --name "Login" --json | jq -r '.data.id')
playwigo steps set --test-case "$CASE_ID" --file ./steps.json --json
playwigo run --test-case "$CASE_ID" --wait --json
```

Test execution always runs on the Playwigo Worker (Cloudflare Browser Run). The CLI only triggers and polls runs.

## Publish to npm (maintainers)

Package name: `@playwigo/cli` (public scoped package).

### 1. One-time setup

1. Create an [npmjs.com](https://www.npmjs.com) account.
2. Create organization **`playwigo`** on npm (or change `"name"` in `package.json` if you use another scope).
3. Add yourself as owner/member of that org.
4. Login locally:

```bash
npm login
npm whoami
```

### 2. Dry run (recommended)

From the monorepo root:

```bash
pnpm --filter @playwigo/cli build
pnpm --filter @playwigo/cli exec npm pack --dry-run
```

Confirm the tarball only includes `dist/` + `README.md` (no `.env`, no source secrets).

### 3. Publish

```bash
cd packages/cli
pnpm publish --access public
```

Or from the repo root:

```bash
pnpm --filter @playwigo/cli publish --access public
```

`prepublishOnly` runs `pnpm build` automatically.

### 4. Verify

```bash
npm view @playwigo/cli
npx @playwigo/cli --help
```

### 5. Later releases

Bump version, then publish again:

```bash
cd packages/cli
npm version patch   # 0.1.0 → 0.1.1
pnpm publish --access public
```

Use `minor` / `major` for breaking or feature releases.

### Notes

- Root app `package.json` stays `"private": true` — only this package is published.
- Never put secrets in the package; API keys belong in the user’s env.
- Users still need a running Playwigo deployment (`PLAYWIGO_API_URL`) and their own API key.
