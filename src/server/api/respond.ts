import { isRedirect } from '@tanstack/react-router'
import { ZodError } from 'zod'

import {
  ApiError,
  ApiUnauthorizedError,
  ApiValidationError,
} from '#/server/api/errors.ts'
import { requireApiSession } from '#/server/api/require-api-session.ts'

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status })
}

function mapUnknownError(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message)
  }

  if (isRedirect(error)) {
    return errorResponse(401, 'unauthorized', 'Unauthorized')
  }

  if (error instanceof ZodError) {
    const message =
      error.issues[0]?.message ?? 'Request validation failed'
    return errorResponse(422, 'validation_error', message)
  }

  if (error instanceof Error) {
    const message = error.message

    if (
      message === 'Project not found' ||
      message === 'Feature not found' ||
      message === 'Test case not found' ||
      message === 'Test run not found'
    ) {
      return errorResponse(404, 'not_found', message)
    }

    return errorResponse(400, 'bad_request', message)
  }

  return errorResponse(500, 'internal_error', 'Internal server error')
}

export async function handleApi(fn: () => Promise<unknown>) {
  try {
    await requireApiSession()
    const data = await fn()
    return Response.json({ data })
  } catch (error) {
    return mapUnknownError(error)
  }
}

export async function parseJsonBody<T>(
  request: Request,
  schema: { parse: (input: unknown) => T },
): Promise<T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new ApiValidationError('Invalid JSON body')
  }

  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw error
    }
    throw new ApiValidationError('Invalid request body')
  }
}

export function methodNotAllowed() {
  return errorResponse(405, 'method_not_allowed', 'Method not allowed')
}

export { ApiUnauthorizedError, ApiValidationError }
