# Playwigo Recorder (browser extension)

WXT + React side-panel extension for recording Playwigo test case steps.

## Develop

From the monorepo root:

```bash
pnpm extension:dev
```

Or from this package:

```bash
pnpm dev
```

Load the unpacked extension from `.output/chrome-mv3-dev` in `chrome://extensions` (Developer mode → Load unpacked).

## Build

```bash
pnpm extension:build
```

Output: `.output/chrome-mv3`.

## Auth

1. Click **Connect with Playwigo** in the side panel.
2. Sign in on the web (if needed) and click **Authorize extension**.
3. The extension receives an API key automatically.

Advanced: paste an API key (`sk-pwg-…`) from **Settings → API Keys**.

Default API URL is `https://playwigo.monolabs.workers.dev` (use `http://localhost:3000` for local web + extension).

**Note:** After changing the extension, reload it in `chrome://extensions` so `externally_connectable` is applied — otherwise Authorize cannot reach the extension.

## Scope

- Browse projects → features → test cases
- Record / edit / reorder steps
- Element picker
- Save via `PUT /api/v1/test-cases/:id/steps`

Create projects, features, and test cases in the web app.
