import {
  calculateInvoiceAmounts,
  type InvoiceAmounts,
} from '../domain/invoices/invoice.calculations.js'
import { isInvoiceOverdue } from '../domain/invoices/invoice.rules.js'
import type {
  Invoice,
  InvoiceStatus,
} from '../domain/invoices/invoice.types.js'
import {
  findAllInvoices,
  findInvoiceById,
  type InvoiceFilters,
} from '../repositories/invoice.repository.js'

import { AppError } from '../errors/app.error.js'

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

export interface InvoiceDetails
  extends Invoice,
    InvoiceAmounts {
  isOverdue: boolean
}

export function getInvoiceDetails(
  invoiceId: string,
  currentDate = getCurrentDateInFrance(),
): InvoiceDetails {
  const invoice = findInvoiceById(invoiceId)

  if (invoice === undefined) {
    throw new AppError(
      404,
      'INVOICE_NOT_FOUND',
      "La facture demandée n'existe pas.",
    )
  }

  const amounts = calculateInvoiceAmounts(invoice)

  return {
    ...invoice,
    ...amounts,
    isOverdue: isInvoiceOverdue(
      invoice,
      currentDate,
    ),
  }
}