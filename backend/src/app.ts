import cors from 'cors'
import express from 'express'
import {
  errorHandler,
  notFoundHandler,
} from './http/middleware/error.middleware.js'
import {
  invoiceRouter,
} from './http/routes/invoice.routes.js'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

export const app = express()

app.disable('x-powered-by')

app.use(helmet())

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(
  express.json({
    limit: '20kb',
  }),
)

const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message:
        'Trop de requêtes ont été envoyées. Veuillez réessayer plus tard.',
    },
  },
})

app.use('/api', apiRateLimiter)

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
  })
})

app.use('/api/invoices', invoiceRouter)

app.use(notFoundHandler)
app.use(errorHandler)