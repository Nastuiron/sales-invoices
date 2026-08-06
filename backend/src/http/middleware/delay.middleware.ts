import type { RequestHandler } from 'express'

const configuredDelay = Number(
  process.env.API_DELAY_MS ?? 600,
)

const delayInMilliseconds =
  Number.isFinite(configuredDelay)
    ? Math.max(0, Math.min(configuredDelay, 5_000))
    : 600

export const simulateApiDelay: RequestHandler = (
  _request,
  _response,
  next,
) => {
  if (
    process.env.NODE_ENV === 'test' ||
    delayInMilliseconds === 0
  ) {
    next()
    return
  }

  setTimeout(next, delayInMilliseconds)
}