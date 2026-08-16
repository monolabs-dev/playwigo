import { readFile } from 'node:fs/promises'

import { Command } from 'commander'

import { apiRequest, createClientFromEnv } from '../client.js'
import { printData, UsageError, type OutputMode } from '../output.js'

export function registerStepsCommand(program: Command) {
  const steps = program.command('steps').description('Manage test case steps')

  steps
    .command('get')
    .description('Get steps for a test case')
    .requiredOption('--test-case <id>', 'Test case ID')
    .option('--json', 'Output JSON', false)
    .action(async (options: OutputMode & { testCase: string }) => {
      const client = createClientFromEnv()
      const data = await apiRequest(
        client,
        'GET',
        `/api/v1/test-cases/${encodeURIComponent(options.testCase)}/steps`,
      )
      printData(data, options)
    })

  steps
    .command('set')
    .description('Replace steps for a test case from a JSON file')
    .requiredOption('--test-case <id>', 'Test case ID')
    .requiredOption('--file <path>', 'JSON file with { "steps": [...] } or an array')
    .option('--json', 'Output JSON', false)
    .action(
      async (options: OutputMode & { testCase: string; file: string }) => {
        let parsed: unknown

        try {
          const raw = await readFile(options.file, 'utf8')
          parsed = JSON.parse(raw)
        } catch {
          throw new UsageError(
            `Unable to read or parse steps file: ${options.file}`,
          )
        }

        let stepsPayload: unknown

        if (Array.isArray(parsed)) {
          stepsPayload = parsed
        } else if (
          parsed &&
          typeof parsed === 'object' &&
          'steps' in parsed &&
          Array.isArray((parsed as { steps: unknown }).steps)
        ) {
          stepsPayload = (parsed as { steps: unknown }).steps
        } else {
          throw new UsageError(
            'Steps file must be a JSON array or an object with a "steps" array',
          )
        }

        const client = createClientFromEnv()
        const data = await apiRequest(
          client,
          'PUT',
          `/api/v1/test-cases/${encodeURIComponent(options.testCase)}/steps`,
          { steps: stepsPayload },
        )
        printData(data, options)
      },
    )
}
