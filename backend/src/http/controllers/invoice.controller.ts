import type {
  Request,
  Response,
} from 'express'

import { AppError } from '../../errors/app.error.js'
import {
  getInvoiceDetails,
  getInvoiceSummaries,
} from '../../services/invoice.service.js'
import {
  invoiceIdParamsSchema,
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

export function getInvoiceController(
  request: Request,
  response: Response,
): void {
  const validationResult =
    invoiceIdParamsSchema.safeParse(request.params)

  if (!validationResult.success) {
    throw new AppError(
      400,
      'INVALID_INVOICE_ID',
      "L'identifiant de la facture est invalide.",
      validationResult.error.issues.map((issue) => ({
        field:
          issue.path.length > 0
            ? issue.path.join('.')
            : 'id',
        message: issue.message,
      })),
    )
  }

  const invoice = getInvoiceDetails(
    validationResult.data.id,
  )

  response.status(200).json({
    data: invoice,
  })
}