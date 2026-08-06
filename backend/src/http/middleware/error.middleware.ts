import type {
  ErrorRequestHandler,
  RequestHandler,
} from 'express'

import { AppError } from '../../errors/app.error.js'

export const notFoundHandler: RequestHandler = (
  request,
  response,
) => {
  response.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `La route ${request.method} ${request.path} n'existe pas.`,
    },
  })
}

function isMalformedJsonError(
  error: unknown,
): boolean {
  return (
    error instanceof SyntaxError &&
    Reflect.get(error, 'status') === 400 &&
    Reflect.get(error, 'type') ===
      'entity.parse.failed'
  )
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (isMalformedJsonError(error)) {
    response.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message:
          'Le corps de la requête contient un JSON invalide.',
      },
    })

    return
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    })

    return
  }

  console.error(error)

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Une erreur interne est survenue. Veuillez réessayer.',
    },
  })
}