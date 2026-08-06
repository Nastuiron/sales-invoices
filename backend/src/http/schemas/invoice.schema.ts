import { z } from 'zod'

import {
  INVOICE_STATUSES,
} from '../../domain/invoices/invoice.types.js'

export const invoiceListQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1, {
        error: 'La recherche ne peut pas être vide.',
      })
      .max(100, {
        error:
          'La recherche ne peut pas dépasser 100 caractères.',
      })
      .optional(),

    status: z
      .enum(INVOICE_STATUSES, {
        error: 'Le statut demandé est invalide.',
      })
      .optional(),
  })
  .strict()

export type InvoiceListQuery = z.infer<
  typeof invoiceListQuerySchema
>