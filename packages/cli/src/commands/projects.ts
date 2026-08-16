import { Command } from 'commander'

import { apiRequest, createClientFromEnv } from '../client.js'
import { printData, type OutputMode } from '../output.js'

type Project = {
  id: string
  name: string
  website: string
}

export function registerProjectsCommand(program: Command) {
  const projects = program
    .command('projects')
    .description('Manage projects')

  projects
    .command('list')
    .description('List projects for the authenticated user')
    .option('--json', 'Output JSON', false)
    .action(async (options: OutputMode) => {
      const client = createClientFromEnv()
      const data = await apiRequest<Project[]>(client, 'GET', '/api/v1/projects')
      printData(data, options)
    })
}
