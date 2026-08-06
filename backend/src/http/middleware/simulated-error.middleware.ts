import type { RequestHandler } from 'express'

import { AppError } from '../../errors/app.error.js'

export const simulateApiError: RequestHandler = (
  request,
  _response,
  next,
) => {
  const simulationRequested =
    request.get('x-simulate-api-error') === 'true'

  if (
    process.env.NODE_ENV !== 'production' &&
    simulationRequested
  ) {
    throw new AppError(
      503,
      'SIMULATED_API_ERROR',
      'Une erreur API a été simulée.',
    )
  }

  next()
}