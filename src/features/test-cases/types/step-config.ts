export type SetVariableStepConfig = {
  name: string
  value: string
}

export type ExtractTextStepConfig = {
  attribute?: string | null
  regex?: string | null
}

export type HttpRequestStepConfig = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers?: Record<string, string> | null
  body?: string | null
  jsonPath?: string | null
  regex?: string | null
  expectStatus?: number | null
  retry?: {
    attempts: number
    intervalMs: number
  } | null
}

export type StepConfigJson =
  | SetVariableStepConfig
  | ExtractTextStepConfig
  | HttpRequestStepConfig
  | null

export function asStepConfigJson(value: unknown): StepConfigJson {
  if (value == null) {
    return null
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as StepConfigJson
}
