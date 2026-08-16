import { Command } from 'commander'

import { apiRequest, createClientFromEnv } from '../client.js'
import { printData, UsageError, type OutputMode } from '../output.js'

type Feature = {
  id: string
  projectId: string
  name: string
  description: string | null
}

export function registerFeaturesCommand(program: Command) {
  const features = program
    .command('features')
    .description('Manage features')

  features
    .command('list')
    .description('List features in a project')
    .requiredOption('--project <id>', 'Project ID')
    .option('--json', 'Output JSON', false)
    .action(async (options: OutputMode & { project: string }) => {
      const client = createClientFromEnv()
      const data = await apiRequest<Feature[]>(
        client,
        'GET',
        `/api/v1/projects/${encodeURIComponent(options.project)}/features`,
      )
      printData(data, options)
    })

  features
    .command('create')
    .description('Create a feature in a project')
    .requiredOption('--project <id>', 'Project ID')
    .requiredOption('--name <name>', 'Feature name')
    .option('--description <text>', 'Feature description')
    .option('--json', 'Output JSON', false)
    .action(
      async (options: OutputMode & {
        project: string
        name: string
        description?: string
      }) => {
        if (!options.name.trim()) {
          throw new UsageError('Name is required')
        }

        const client = createClientFromEnv()
        const data = await apiRequest<Feature>(
          client,
          'POST',
          `/api/v1/projects/${encodeURIComponent(options.project)}/features`,
          {
            name: options.name,
            description: options.description ?? null,
          },
        )
        printData(data, options)
      },
    )
}
