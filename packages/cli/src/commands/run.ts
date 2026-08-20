import { setTimeout as delay } from 'node:timers/promises'

import { Command } from 'commander'

import { apiRequest, createClientFromEnv } from '../client.js'
import { CliError, printData, UsageError, type OutputMode } from '../output.js'

const TERMINAL_STATUSES = new Set(['passed', 'failed', 'error', 'cancelled'])
const POLL_INTERVAL_MS = 1500

type RunStartResult = {
  testRunId: string
  status: string
}

type RunStatusResult = {
  testRunId: string
  status: string
  variables?: Record<string, string> | null
  resolvedVariables?: Record<string, string> | null
  steps?: Array<{
    id?: string
    status: string
    errorMessage?: string | null
    resolvedValue?: string | null
  }>
}

function parseVarOptions(raw: string[] | undefined) {
  const variables: Record<string, string> = {}

  for (const entry of raw ?? []) {
    const separator = entry.indexOf('=')
    if (separator <= 0) {
      throw new UsageError(
        `Invalid --var "${entry}". Expected key=value (e.g. --var otpEndpoint=https://...)`,
      )
    }

    const key = entry.slice(0, separator).trim()
    const value = entry.slice(separator + 1)

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new UsageError(
        `Invalid variable name "${key}". Use letters, numbers, and underscores.`,
      )
    }

    variables[key] = value
  }

  return Object.keys(variables).length > 0 ? variables : undefined
}

export function registerRunCommand(program: Command) {
  const run = program
    .command('run')
    .description('Run a test case or wait for a run')
    .argument('[testCaseId]', 'Test case ID to run')
    .option('--test-case <id>', 'Test case ID to run')
    .option(
      '--var <key=value>',
      'Pass a run variable (repeatable)',
      (value, previous: string[]) => [...previous, value],
      [] as string[],
    )
    .option('--wait', 'Wait until the run finishes', false)
    .option('--json', 'Output JSON', false)
    .action(
      async (
        testCaseIdArg: string | undefined,
        options: OutputMode & {
          testCase?: string
          wait: boolean
          var: string[]
        },
      ) => {
        const testCaseId = options.testCase ?? testCaseIdArg

        if (!testCaseId) {
          throw new CliError(
            'Provide a test case ID: playwigo run <id> or --test-case <id>',
            2,
          )
        }

        const variables = parseVarOptions(options.var)
        const client = createClientFromEnv()
        const started = await apiRequest<RunStartResult>(
          client,
          'POST',
          `/api/v1/test-cases/${encodeURIComponent(testCaseId)}/run`,
          variables ? { variables } : {},
        )

        if (!options.wait) {
          printData(started, options)
          return
        }

        const final = await waitForRun(client, started.testRunId, options)
        printData(final, options)

        if (final.status !== 'passed') {
          process.exitCode = 1
        }
      },
    )

  run
    .command('wait')
    .description('Poll a test run until it finishes')
    .requiredOption('--run <id>', 'Test run ID')
    .option('--json', 'Output JSON', false)
    .action(async (options: OutputMode & { run: string }) => {
      const client = createClientFromEnv()
      const final = await waitForRun(client, options.run, options)
      printData(final, options)

      if (final.status !== 'passed') {
        process.exitCode = 1
      }
    })
}

export function registerRunsCommand(program: Command) {
  const runs = program.command('runs').description('List or cancel test runs')

  runs
    .command('list')
    .description('List recent test runs for a project')
    .requiredOption('--project <id>', 'Project ID')
    .option('--limit <n>', 'Max runs to return', '50')
    .option('--json', 'Output JSON', false)
    .action(
      async (options: OutputMode & { project: string; limit: string }) => {
        const client = createClientFromEnv()
        const limit = Number(options.limit)
        const query =
          Number.isFinite(limit) && limit > 0
            ? `?limit=${encodeURIComponent(String(limit))}`
            : ''
        const data = await apiRequest(
          client,
          'GET',
          `/api/v1/projects/${encodeURIComponent(options.project)}/test-runs${query}`,
        )
        printData(data, options)
      },
    )

  runs
    .command('cancel')
    .description('Cancel a running test run')
    .requiredOption('--run <id>', 'Test run ID')
    .option('--json', 'Output JSON', false)
    .action(async (options: OutputMode & { run: string }) => {
      const client = createClientFromEnv()
      const data = await apiRequest(
        client,
        'POST',
        `/api/v1/test-runs/${encodeURIComponent(options.run)}/cancel`,
      )
      printData(data, options)
    })
}

async function waitForRun(
  client: ReturnType<typeof createClientFromEnv>,
  testRunId: string,
  options: OutputMode,
) {
  for (;;) {
    const status = await apiRequest<RunStatusResult>(
      client,
      'GET',
      `/api/v1/test-runs/${encodeURIComponent(testRunId)}`,
    )

    if (TERMINAL_STATUSES.has(status.status)) {
      return status
    }

    if (!options.json) {
      process.stderr.write(`status=${status.status} waiting...\n`)
    }

    await delay(POLL_INTERVAL_MS)
  }
}
