import { z } from 'zod'

import {
  INVOICE_STATUSES,
  PAYMENT_METHODS,
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

const issueInvoiceSchema = z
  .object({
    status: z.literal('issued'),
  })
  .strict()

const sendInvoiceSchema = z
  .object({
    status: z.literal('sent'),
  })
  .strict()

const payInvoiceSchema = z
  .object({
    status: z.literal('paid'),

    payment: z
      .object({
        amountCents: z
          .number()
          .int()
          .positive()
          .max(Number.MAX_SAFE_INTEGER),

        method: z.enum(PAYMENT_METHODS, {
          error: 'Le moyen de paiement est invalide.',
        }),

        reference: z
          .string()
          .trim()
          .min(1)
          .max(100)
          .optional(),
      })
      .strict(),
  })
  .strict()

const creditInvoiceSchema = z
  .object({
    status: z.literal('credited'),

    creditNote: z
      .object({
        reason: z
          .string()
          .trim()
          .min(3, {
            error:
              "Le motif de l'avoir doit contenir au moins 3 caractères.",
          })
          .max(500, {
            error:
              "Le motif de l'avoir ne peut pas dépasser 500 caractères.",
          }),
      })
      .strict(),
  })
  .strict()

export const invoiceStatusUpdateSchema =
  z.discriminatedUnion('status', [
    issueInvoiceSchema,
    sendInvoiceSchema,
    payInvoiceSchema,
    creditInvoiceSchema,
  ])

export type InvoiceStatusUpdate = z.infer<
  typeof invoiceStatusUpdateSchema
>