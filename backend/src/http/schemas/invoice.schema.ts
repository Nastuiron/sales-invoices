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

export const invoiceIdParamsSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1, {
        error: "L'identifiant de la facture est obligatoire.",
      })
      .max(100, {
        error:
          "L'identifiant de la facture est trop long.",
      })
      .regex(/^[a-z0-9-]+$/, {
        error:
          "Le format de l'identifiant de la facture est invalide.",
      }),
  })
  .strict()