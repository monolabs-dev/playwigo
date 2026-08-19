import {
  evaluateGeneratorExpression,
  interpolate,
  isSensitiveVariableName,
  maskSensitiveValue,
} from '#/lib/step-template.ts'

export type RunVariableSeed = Record<string, string>

export class RunVariableContext {
  private readonly variables = new Map<string, string>()
  private readonly generatorCache = new Map<string, string>()

  constructor(seed: RunVariableSeed = {}) {
    for (const [name, value] of Object.entries(seed)) {
      this.set(name, value)
    }
  }

  set(name: string, value: string) {
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('Variable name cannot be empty')
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
      throw new Error(
        `Invalid variable name "${trimmed}". Use letters, numbers, and underscores.`,
      )
    }
    this.variables.set(trimmed, value)
  }

  get(name: string) {
    return this.variables.get(name)
  }

  has(name: string) {
    return this.variables.has(name)
  }

  resolve(text: string | null | undefined, options?: { stepIndex?: number }) {
    return interpolate(
      text,
      {
        getVariable: (name) => this.variables.get(name),
        getGenerator: (expression) => this.getGenerator(expression),
      },
      options,
    )
  }

  snapshot(options?: { maskSensitive?: boolean }) {
    const maskSensitive = options?.maskSensitive ?? true
    const result: Record<string, string> = {}

    for (const [name, value] of this.variables.entries()) {
      result[name] =
        maskSensitive && isSensitiveVariableName(name)
          ? maskSensitiveValue(value)
          : value
    }

    return result
  }

  maskValueForField(fieldName: string | null | undefined, value: string | null) {
    if (value == null) {
      return null
    }

    if (fieldName && isSensitiveVariableName(fieldName)) {
      return maskSensitiveValue(value)
    }

    if (isSensitiveVariableName(value)) {
      return maskSensitiveValue(value)
    }

    // Mask resolved values that look like they came from sensitive variables
    // when the template itself referenced a sensitive name (best-effort).
    return value
  }

  private getGenerator(expression: string) {
    const cached = this.generatorCache.get(expression)
    if (cached !== undefined) {
      return cached
    }

    const value = evaluateGeneratorExpression(expression)
    this.generatorCache.set(expression, value)
    return value
  }
}

export function maskRunVariables(
  variables: Record<string, string> | null | undefined,
) {
  if (!variables) {
    return null
  }

  const result: Record<string, string> = {}
  for (const [name, value] of Object.entries(variables)) {
    result[name] = isSensitiveVariableName(name)
      ? maskSensitiveValue(value)
      : value
  }
  return result
}

export function maskResolvedStepValue(
  template: string | null | undefined,
  resolved: string | null | undefined,
) {
  if (resolved == null) {
    return null
  }

  if (
    (template && isSensitiveVariableName(template)) ||
    isSensitiveVariableName(resolved)
  ) {
    // If the template references a sensitive variable name, mask the resolved value
    const tokens =
      template?.match(/\{\{\s*([^$}]+?)\s*\}\}/g)?.map((token) =>
        token.replace(/^\{\{\s*|\s*\}\}$/g, ''),
      ) ?? []

    if (
      tokens.some((token) => isSensitiveVariableName(token)) ||
      isSensitiveVariableName(template ?? '')
    ) {
      return maskSensitiveValue(resolved)
    }
  }

  if (template) {
    const tokens =
      template.match(/\{\{\s*([^$}]+?)\s*\}\}/g)?.map((token) =>
        token.replace(/^\{\{\s*|\s*\}\}$/g, ''),
      ) ?? []
    if (tokens.some((token) => isSensitiveVariableName(token))) {
      return maskSensitiveValue(resolved)
    }
  }

  return resolved
}
