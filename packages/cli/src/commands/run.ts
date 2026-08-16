import { setTimeout as delay } from 'node:timers/promises'

import { Command } from 'commander'

import { apiRequest, createClientFromEnv } from '../client.js'
import { printData, type OutputMode } from '../output.js'

const TERMINAL_STATUSES = new Set(['passed', 'failed', 'error'])
const POLL_INTERVAL_MS = 1500

type RunStartResult = {
  testRunId: string
  status: string
}

type RunStatusResult = {
  testRunId: string
  status: string
  steps?: Array<{
    id: string
    status: string
    errorMessage?: string | null
  }>
}

export function registerRunCommand(program: Command) {
  const run = program
    .command('run')
    .description('Run a test case or wait for a run')
    .argument('[testCaseId]', 'Test case ID to run')
    .option('--test-case <id>', 'Test case ID to run')
    .option('--wait', 'Wait until the run finishes', false)
    .option('--json', 'Output JSON', false)
    .action(
      async (
        testCaseIdArg: string | undefined,
        options: OutputMode & { testCase?: string; wait: boolean },
      ) => {
        const testCaseId = options.testCase ?? testCaseIdArg

        if (!testCaseId) {
          throw new CliError(
            'Provide a test case ID: playwigo run <id> or --test-case <id>',
            2,
          )
        }

        const client = createClientFromEnv()
        const started = await apiRequest<RunStartResult>(
          client,
          'POST',
          `/api/v1/test-cases/${encodeURIComponent(testCaseId)}/run`,
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
  const runs = program.command('runs').description('List test runs')

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
