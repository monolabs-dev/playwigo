# Playwigo CLI reference

Binary: `playwigo` (`npx @playwigo/cli`). Env: `PLAYWIGO_API_URL`, `PLAYWIGO_API_KEY`.

Success stdout (with `--json`):

```json
{ "data": … }
```

Error stderr (with `--json`):

```json
{ "error": { "message": "…" } }
```

Lists live at `.data[]`. Creates live at `.data`. `--json` may also be enabled with `PLAYWIGO_JSON=1`.

## projects

```bash
playwigo projects list --json
```

Returns `{ id, name, website }[]`. No create/update/delete.

## features

```bash
playwigo features list --project <id> --json
playwigo features create --project <id> --name "Checkout" --json
playwigo features create --project <id> --name "Checkout" --description "…" --json
```

Returns `{ id, projectId, name, description }`.

## test-cases

```bash
playwigo test-cases list --feature <id> --json
playwigo test-cases create --feature <id> --name "Guest can check out" --json
playwigo test-cases create --feature <id> --name "…" --base-url https://staging.example.com --json
playwigo test-cases create --feature <id> --name "…" --test-account <id> --json
```

Returns `{ id, featureId, name, baseUrl, testAccountId }`.

`--base-url` overrides the project website for that case. `--test-account` is an id from the Playwigo UI (no list command).

No update/delete/duplicate in the CLI.

## steps

```bash
playwigo steps get --test-case <id> --json
playwigo steps set --test-case <id> --file steps.json --json
```

`steps set` **replaces** all steps. File is either `{ "steps": [ … ] }` or a bare array. Max 100 steps. Schema: [steps.md](steps.md).

## run

```bash
playwigo run --test-case <id> --json          # start; prints { testRunId, status }
playwigo run --test-case <id> --wait --json   # start and poll until terminal
playwigo run wait --run <id> --json           # poll an existing run
```

Terminal statuses: `passed`, `failed`, `error`. `--wait` / `run wait` exit `1` when status is not `passed`.

Wait payload includes `testRunId`, `status`, `errorMessage`, `durationMs`, `steps[]` (each with `status`, `action`, `errorMessage`, `screenshotUrl`).

Do not start a second run while one is already `pending` / `queued` / `running` for that case.

## runs

```bash
playwigo runs list --project <id> --json
playwigo runs list --project <id> --limit 20 --json
```

Recent runs for a project (default limit 50).

## Not in the CLI

Create these in the Playwigo web app:

- Projects
- Test accounts and login flows
- Test case update / delete / duplicate
- Feature update / delete
