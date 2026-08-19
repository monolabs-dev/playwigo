# Playwigo steps

Each step:

```json
{
  "action": "click",
  "selectorType": "css",
  "selector": "button[type='submit']",
  "value": null,
  "outputVariable": null,
  "config": null
}
```

`id` is optional on create (server assigns). `steps set` sends the full ordered list.

## Template variables

Step `value`, `selector`, and many `config` fields support `{{...}}` tokens. Resolution happens **at run time**.

### Seeded from the test account / case

| Token | Source |
| --- | --- |
| `{{email}}` | Assigned test account email |
| `{{password}}` | Assigned test account password |
| `{{loginUrl}}` | Test account login URL (falls back to project website) |
| `{{baseUrl}}` | Test case `baseUrl` |

### Built-in generators (memoized per run)

| Token | Example |
| --- | --- |
| `{{$uuid}}` | Random UUID |
| `{{$timestamp}}` | Unix ms |
| `{{$isoDate}}` | ISO-8601 |
| `{{$randomInt(6)}}` | 6 random digits |
| `{{$randomString(8)}}` | 8 alphanumeric chars |
| `{{$email}}` | `qa+<id>@playwigo.test` |
| `{{$email:example.com}}` | Custom domain |

Use `{{$email}}` for registration flows so re-runs never collide on a used address. The same token always resolves to the same value within one run.

### Run variables (`--var`)

Pass extra values when starting a run:

```bash
playwigo run --test-case <id> --var otpEndpoint=https://app.example/__test/otp --wait --json
```

Prefer supplying secrets and environment-specific URLs this way instead of hardcoding them in steps. Agents should fetch OTP / seed data *before* the run when possible, then pass `--var`, rather than pausing mid-browser.

## Actions

| action | selector | value | outputVariable | config | Notes |
| --- | --- | --- | --- | --- | --- |
| `goto` | no | URL | no | no | Prefer absolute `https://` or `{{baseUrl}}/...` |
| `click` | yes | no | no | no | |
| `fill` | yes | text | no | no | Supports templates |
| `select` | yes | option | no | no | |
| `check` | yes | no | no | no | |
| `uncheck` | yes | no | no | no | |
| `hover` | yes | no | no | no | |
| `wait` | yes | no | no | no | Wait for the locator |
| `waitTimeout` | no | ms string | no | no | e.g. `"1000"` |
| `pressKey` | no | key name | no | no | e.g. `"Enter"` |
| `expectToHaveUrl` | no | URL | no | no | |
| `expectToHaveTitle` | no | title | no | no | |
| `expectToHaveText` | yes | exact text | no | no | |
| `expectToContainText` | yes | substring | no | no | |
| `setVariable` | no | no | no | `{ name, value }` | Writes a named variable |
| `extractText` | yes | no | yes | `{ attribute?, regex? }` | Reads DOM into a variable |
| `httpRequest` | no | no | yes | see below | Fetches OTP / API data |

Omit unused fields. Do not use legacy action names (`type`, `press`, `dblclick`, `selectOption`, `waitForSelector`, `reload`).

### `setVariable` config

```json
{
  "action": "setVariable",
  "config": { "name": "signupEmail", "value": "{{$email}}" }
}
```

### `extractText` config

```json
{
  "action": "extractText",
  "selectorType": "css",
  "selector": "[data-testid='otp']",
  "outputVariable": "otp",
  "config": { "attribute": null, "regex": "(\\d{6})" }
}
```

### `httpRequest` config

```json
{
  "action": "httpRequest",
  "outputVariable": "otp",
  "config": {
    "method": "GET",
    "url": "{{otpEndpoint}}?email={{$email}}",
    "jsonPath": "data.code",
    "regex": null,
    "expectStatus": 200,
    "retry": { "attempts": 10, "intervalMs": 2000 },
    "body": null,
    "headers": null
  }
}
```

Private / loopback hosts are blocked. Redirects are not followed. Use `retry` when waiting for email OTP delivery.

## Selector types

`css` | `id` | `class` | `xpath` | `text`

Prefer `css`. `id` and `class` may be written with or without `#` / `.`. `text` is Playwright `getByText` (substring).

## Example: registration with unique email + OTP

```json
{
  "steps": [
    { "action": "goto", "value": "{{baseUrl}}/register" },
    {
      "action": "fill",
      "selectorType": "id",
      "selector": "email",
      "value": "{{$email}}"
    },
    {
      "action": "fill",
      "selectorType": "id",
      "selector": "password",
      "value": "Passw0rd!"
    },
    {
      "action": "click",
      "selectorType": "css",
      "selector": "button[type='submit']"
    },
    {
      "action": "httpRequest",
      "outputVariable": "otp",
      "config": {
        "method": "GET",
        "url": "{{otpEndpoint}}?email={{$email}}",
        "jsonPath": "data.code",
        "retry": { "attempts": 10, "intervalMs": 2000 }
      }
    },
    {
      "action": "fill",
      "selectorType": "id",
      "selector": "otp",
      "value": "{{otp}}"
    },
    {
      "action": "click",
      "selectorType": "css",
      "selector": "button[type='submit']"
    },
    {
      "action": "expectToContainText",
      "selectorType": "css",
      "selector": "h1",
      "value": "Welcome"
    }
  ]
}
```

Run with:

```bash
playwigo run --test-case <id> \
  --var otpEndpoint=https://staging.example/__test/otp \
  --wait --json
```

## Auth

Test cases authenticate through the assigned test account’s login flow.

1. User creates the test account + login flow in the Playwigo UI (login steps may use `{{email}}`, `{{password}}`, `{{loginUrl}}`).
2. CLI: `test-cases create … --test-account <id>`.
3. Case steps start after login. Do not duplicate the login flow in `steps.json`.
