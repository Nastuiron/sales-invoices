import axios from 'axios'

import type {
  ApiErrorResponse,
} from '../types/invoice'

export class ApiError extends Error {
  readonly code: string
  readonly status?: number
  readonly details?: unknown

  constructor(
    code: string,
    message: string,
    status?: number,
    details?: unknown,
  ) {
    super(message)

    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function normalizeApiError(
  error: unknown,
): ApiError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return new ApiError(
      'UNKNOWN_ERROR',
      'Une erreur inattendue est survenue.',
    )
  }

  const apiError = error.response?.data?.error

  if (apiError !== undefined) {
    return new ApiError(
      apiError.code,
      apiError.message,
      error.response?.status,
      apiError.details,
    )
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError(
      'REQUEST_TIMEOUT',
      "L'API met trop de temps à répondre.",
    )
  }

  if (error.response === undefined) {
    return new ApiError(
      'NETWORK_ERROR',
      "Impossible de contacter l'API.",
    )
  }

  return new ApiError(
    'HTTP_ERROR',
    'Une erreur est survenue pendant la requête.',
    error.response.status,
  )
}