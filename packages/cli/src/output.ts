export class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, exitCode = 1) {
    super(message)
    this.name = 'CliError'
    this.exitCode = exitCode
  }
}

export class UsageError extends CliError {
  constructor(message: string) {
    super(message, 2)
    this.name = 'UsageError'
  }
}

export type OutputMode = {
  json: boolean
}

export function printData(data: unknown, options: OutputMode) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ data }, null, 2)}\n`)
    return
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      process.stdout.write('(empty)\n')
      return
    }
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`)
    return
  }

  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`)
}

export function printError(error: unknown, options: OutputMode) {
  const message =
    error instanceof Error ? error.message : 'Unexpected CLI error'

  if (options.json) {
    process.stderr.write(
      `${JSON.stringify({ error: { message } }, null, 2)}\n`,
    )
    return
  }

  process.stderr.write(`Error: ${message}\n`)
}
