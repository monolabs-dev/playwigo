import { Command, CommanderError } from 'commander'

import { registerFeaturesCommand } from './commands/features.js'
import { registerProjectsCommand } from './commands/projects.js'
import { registerRunCommand, registerRunsCommand } from './commands/run.js'
import { registerStepsCommand } from './commands/steps.js'
import { registerTestCasesCommand } from './commands/test-cases.js'
import { CliError, printError } from './output.js'

const program = new Command()

program
  .name('playwigo')
  .description('Playwigo CLI for AI agents and automation')
  .version('0.1.0')
  .showHelpAfterError(false)
  .exitOverride()

registerProjectsCommand(program)
registerFeaturesCommand(program)
registerTestCasesCommand(program)
registerStepsCommand(program)
registerRunCommand(program)
registerRunsCommand(program)

async function main() {
  const json =
    process.argv.includes('--json') || process.env.PLAYWIGO_JSON === '1'

  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.exitCode === 0) {
        process.exit(0)
      }
      printError(error, { json })
      process.exit(error.exitCode || 2)
    }

    printError(error, { json })
    process.exit(error instanceof CliError ? error.exitCode : 1)
  }
}

void main()
