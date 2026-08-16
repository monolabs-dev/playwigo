export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export class ApiUnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, 'unauthorized', message)
    this.name = 'ApiUnauthorizedError'
  }
}

export class ApiValidationError extends ApiError {
  constructor(message: string) {
    super(422, 'validation_error', message)
    this.name = 'ApiValidationError'
  }
}
