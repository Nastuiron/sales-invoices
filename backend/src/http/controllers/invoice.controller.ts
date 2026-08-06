import type {
  Request,
  Response,
} from 'express'

import { AppError } from '../../errors/app.error.js'
import {
  changeInvoiceStatus,
  getInvoiceDetails,
  getInvoiceSummaries,
} from '../../services/invoice.service.js'
import {
  invoiceIdParamsSchema,
  invoiceListQuerySchema,
  invoiceStatusUpdateSchema,
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

export function updateInvoiceStatusController(
  request: Request,
  response: Response,
): void {
  const paramsResult =
    invoiceIdParamsSchema.safeParse(request.params)

  if (!paramsResult.success) {
    throw new AppError(
      400,
      'INVALID_INVOICE_ID',
      "L'identifiant de la facture est invalide.",
      paramsResult.error.issues.map((issue) => ({
        field:
          issue.path.length > 0
            ? issue.path.join('.')
            : 'id',
        message: issue.message,
      })),
    )
  }

  const bodyResult =
    invoiceStatusUpdateSchema.safeParse(
      request.body,
    )

  if (!bodyResult.success) {
    throw new AppError(
      400,
      'INVALID_STATUS_UPDATE',
      'Les données du changement de statut sont invalides.',
      bodyResult.error.issues.map((issue) => ({
        field:
          issue.path.length > 0
            ? issue.path.join('.')
            : 'body',
        message: issue.message,
      })),
    )
  }

  const invoice = changeInvoiceStatus(
    paramsResult.data.id,
    bodyResult.data,
  )

  response.status(200).json({
    data: invoice,
    message:
      'Le statut de la facture a été mis à jour.',
  })
}