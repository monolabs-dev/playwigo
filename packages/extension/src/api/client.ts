import {
  DEFAULT_API_URL,
  type FeatureSummary,
  type Project,
  type StepInput,
  type TestCaseStepsPayload,
  type TestCaseSummary,
} from './types'

export type ApiClientOptions = {
  baseUrl: string
  apiKey: string
}

export type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }

  get isUnauthorized() {
    return this.code === 'unauthorized' || this.status === 401
  }
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

export async function apiRequest<T>(
  client: ApiClientOptions,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${normalizeBaseUrl(client.baseUrl)}${path}`

  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      'x-api-key': client.apiKey,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let parsed: unknown = null

  if (text.length > 0) {
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new ApiError(
        `Invalid JSON response from ${method} ${path} (${response.status})`,
        'invalid_json',
        response.status,
      )
    }
  }

  if (!response.ok) {
    const err = parsed as ApiErrorBody | null
    throw new ApiError(
      err?.error?.message ??
        `Request failed: ${method} ${path} (${response.status})`,
      err?.error?.code ?? 'request_failed',
      response.status,
    )
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    (parsed as { data: T }).data !== undefined
  ) {
    return (parsed as { data: T }).data
  }

  return parsed as T
}

export function createClient(
  apiKey: string,
  baseUrl = DEFAULT_API_URL,
): ApiClientOptions {
  return {
    apiKey,
    baseUrl: normalizeBaseUrl(baseUrl || DEFAULT_API_URL),
  }
}

export function listProjects(client: ApiClientOptions) {
  return apiRequest<Project[]>(client, 'GET', '/api/v1/projects')
}

export function listFeatures(client: ApiClientOptions, projectId: string) {
  return apiRequest<FeatureSummary[]>(
    client,
    'GET',
    `/api/v1/projects/${encodeURIComponent(projectId)}/features`,
  )
}

export function listTestCases(client: ApiClientOptions, featureId: string) {
  return apiRequest<TestCaseSummary[]>(
    client,
    'GET',
    `/api/v1/features/${encodeURIComponent(featureId)}/test-cases`,
  )
}

export function listSteps(client: ApiClientOptions, testCaseId: string) {
  return apiRequest<TestCaseStepsPayload>(
    client,
    'GET',
    `/api/v1/test-cases/${encodeURIComponent(testCaseId)}/steps`,
  )
}

export function replaceSteps(
  client: ApiClientOptions,
  testCaseId: string,
  steps: StepInput[],
) {
  return apiRequest<{
    steps: TestCaseStepsPayload['steps']
    testCase: TestCaseSummary
  }>(client, 'PUT', `/api/v1/test-cases/${encodeURIComponent(testCaseId)}/steps`, {
    steps,
  })
}

export function webAppUrl(baseUrl: string, path = '') {
  return `${normalizeBaseUrl(baseUrl || DEFAULT_API_URL)}${path}`
}
