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

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
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