export type SetVariableStepConfig = {
  name: string
  value: string
}

export type ExtractTextStepConfig = {
  attribute?: string | null
  regex?: string | null
}

export type BrowserStepConfig = {
  retry?: {
    attempts: number
    intervalMs: number
  }
  forceClick?: boolean
  scopeToDialog?: boolean
  settleBeforeMs?: number
  /** For `wait` steps — default `visible`. */
  waitState?: 'attached' | 'visible' | 'hidden'
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
  | BrowserStepConfig
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
