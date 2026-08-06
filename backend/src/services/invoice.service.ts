import { calculateInvoiceAmounts } from '../domain/invoices/invoice.calculations.js'
import { isInvoiceOverdue } from '../domain/invoices/invoice.rules.js'
import type {
  InvoiceStatus,
} from '../domain/invoices/invoice.types.js'
import {
  findAllInvoices,
  type InvoiceFilters,
} from '../repositories/invoice.repository.js'

export interface InvoiceSummary {
  id: string
  invoiceNumber?: string
  status: InvoiceStatus

  customer: {
    id: string
    name: string
  }

  issueDate?: string
  dueDate?: string
  currency: 'EUR'

  subtotalCents: number
  vatAmountCents: number
  totalCents: number
  amountPaidCents: number
  remainingAmountCents: number

  isOverdue: boolean
}

function getCurrentDateInFrance(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function getInvoiceSummaries(
  filters: InvoiceFilters = {},
  currentDate = getCurrentDateInFrance(),
): InvoiceSummary[] {
  const invoices = findAllInvoices(filters)

  return invoices.map((invoice) => {
    const amounts = calculateInvoiceAmounts(invoice)

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,

      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
      },

      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,

      subtotalCents: amounts.subtotalCents,
      vatAmountCents: amounts.vatAmountCents,
      totalCents: amounts.totalCents,
      amountPaidCents: invoice.amountPaidCents,
      remainingAmountCents:
        amounts.remainingAmountCents,

      isOverdue: isInvoiceOverdue(
        invoice,
        currentDate,
      ),
    }
  })
}