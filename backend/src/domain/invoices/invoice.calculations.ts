import type { Invoice, InvoiceLine } from './invoice.types.js'

export interface InvoiceLineAmounts {
  subtotalCents: number
  vatAmountCents: number
  totalCents: number
}

export interface InvoiceAmounts {
  subtotalCents: number
  vatAmountCents: number
  totalCents: number
  remainingAmountCents: number
}

export function calculateInvoiceLineAmounts(
  line: InvoiceLine,
): InvoiceLineAmounts {
  const subtotalCents = Math.round(line.quantity * line.unitPriceCents)
  const vatAmountCents = Math.round(
    subtotalCents * (line.vatRate / 100),
  )

  return {
    subtotalCents,
    vatAmountCents,
    totalCents: subtotalCents + vatAmountCents,
  }
}

export function calculateInvoiceAmounts(
  invoice: Invoice,
): InvoiceAmounts {
  const totals = invoice.lines.reduce(
    (result, line) => {
      const lineAmounts = calculateInvoiceLineAmounts(line)

      return {
        subtotalCents:
          result.subtotalCents + lineAmounts.subtotalCents,
        vatAmountCents:
          result.vatAmountCents + lineAmounts.vatAmountCents,
        totalCents:
          result.totalCents + lineAmounts.totalCents,
      }
    },
    {
      subtotalCents: 0,
      vatAmountCents: 0,
      totalCents: 0,
    },
  )

  return {
    ...totals,
    remainingAmountCents:
      totals.totalCents - invoice.amountPaidCents,
  }
}