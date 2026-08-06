import type {
  Request,
  Response,
} from 'express'

import { AppError } from '../../errors/app.error.js'
import { getInvoiceSummaries } from '../../services/invoice.service.js'
import {
  invoiceListQuerySchema,
} from '../schemas/invoice.schema.js'

export function listInvoicesController(
  request: Request,
  response: Response,
): void {
  const validationResult =
    invoiceListQuerySchema.safeParse(request.query)

  if (!validationResult.success) {
    throw new AppError(
      400,
      'INVALID_QUERY_PARAMETERS',
      'Les paramètres de recherche sont invalides.',
      validationResult.error.issues.map((issue) => ({
        field:
          issue.path.length > 0
            ? issue.path.join('.')
            : 'query',
        message: issue.message,
      })),
    )
  }

  const invoices = getInvoiceSummaries(
    validationResult.data,
  )

  response.status(200).json({
    data: invoices,
    meta: {
      count: invoices.length,
    },
  })
}