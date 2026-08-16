import { Command } from 'commander'

import { apiRequest, createClientFromEnv } from '../client.js'
import { printData, UsageError, type OutputMode } from '../output.js'

type TestCase = {
  id: string
  featureId: string
  name: string
  baseUrl: string | null
  testAccountId: string | null
}

export function registerTestCasesCommand(program: Command) {
  const testCases = program
    .command('test-cases')
    .description('Manage test cases')

  testCases
    .command('list')
    .description('List test cases in a feature')
    .requiredOption('--feature <id>', 'Feature ID')
    .option('--json', 'Output JSON', false)
    .action(async (options: OutputMode & { feature: string }) => {
      const client = createClientFromEnv()
      const data = await apiRequest<TestCase[]>(
        client,
        'GET',
        `/api/v1/features/${encodeURIComponent(options.feature)}/test-cases`,
      )
      printData(data, options)
    })

  testCases
    .command('create')
    .description('Create a test case in a feature')
    .requiredOption('--feature <id>', 'Feature ID')
    .requiredOption('--name <name>', 'Test case name')
    .option('--base-url <url>', 'Optional base URL override')
    .option('--test-account <id>', 'Optional test account ID')
    .option('--json', 'Output JSON', false)
    .action(
      async (options: OutputMode & {
        feature: string
        name: string
        baseUrl?: string
        testAccount?: string
      }) => {
        if (!options.name.trim()) {
          throw new UsageError('Name is required')
        }

        const client = createClientFromEnv()
        const data = await apiRequest<TestCase>(
          client,
          'POST',
          `/api/v1/features/${encodeURIComponent(options.feature)}/test-cases`,
          {
            name: options.name,
            baseUrl: options.baseUrl ?? null,
            testAccountId: options.testAccount ?? null,
          },
        )
        printData(data, options)
      },
    )
}
