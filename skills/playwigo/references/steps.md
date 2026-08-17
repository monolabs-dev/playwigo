# Playwigo steps

Each step:

```json
{
  "action": "click",
  "selectorType": "css",
  "selector": "button[type='submit']",
  "value": null
}
```

`id` is optional on create (server assigns). `steps set` sends the full ordered list.

## Actions

| action | selector | value | Notes |
| --- | --- | --- | --- |
| `goto` | no | URL | Prefer an absolute `https://` URL |
| `click` | yes | no | |
| `fill` | yes | text to type | |
| `select` | yes | option value | |
| `check` | yes | no | |
| `uncheck` | yes | no | |
| `hover` | yes | no | |
| `wait` | yes | no | Wait for the locator |
| `waitTimeout` | no | ms as a string, e.g. `"1000"` | |
| `pressKey` | no | key name, e.g. `"Enter"` | |
| `expectToHaveUrl` | no | URL or pattern | |
| `expectToHaveTitle` | no | page title | |
| `expectToHaveText` | yes | exact text | |
| `expectToContainText` | yes | substring | |

Omit `selector` / `selectorType` when the action does not use them. Omit `value` when unused.

Do not use legacy action names (`type`, `press`, `dblclick`, `selectOption`, `waitForSelector`, `reload`).

## Selector types

`css` | `id` | `class` | `xpath` | `text`

Prefer `css`. `id` and `class` may be written with or without `#` / `.` — the runner normalizes them. `text` is Playwright `getByText` (substring, not exact).

Do not use `role`, `label`, or `placeholder` — those are legacy and stored as `css`.

If the user did not provide a selector, ask. Do not invent brittle nth-child paths. Element picking is only available in the Playwigo browser extension.

## Example

```json
{
  "steps": [
    {
      "action": "goto",
      "value": "https://example.com/login"
    },
    {
      "action": "fill",
      "selectorType": "css",
      "selector": "input[name='email']",
      "value": "user@example.com"
    },
    {
      "action": "fill",
      "selectorType": "css",
      "selector": "input[name='password']",
      "value": "secret"
    },
    {
      "action": "click",
      "selectorType": "css",
      "selector": "button[type='submit']"
    },
    {
      "action": "expectToHaveUrl",
      "value": "https://example.com/dashboard"
    }
  ]
}
```

Only write a login sequence like this when the user explicitly wants an unauthenticated case that logs in inline. Preferred: assign a test account so Playwigo runs the login flow as a prelude, then start the case steps on the post-login page.

If the case has a `baseUrl` (or the project website) and the first step is not `goto` and there is no login prelude, the runner already navigates to `baseUrl` first.

## Auth

Test cases authenticate through the assigned test account’s login flow, not by guessing email/password fields.

1. User creates the test account + login flow in the Playwigo UI.
2. CLI: `test-cases create … --test-account <id>`.
3. Case steps start after login. Do not duplicate the login flow in `steps.json`.
