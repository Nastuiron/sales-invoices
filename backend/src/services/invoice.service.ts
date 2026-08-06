import {
  calculateInvoiceAmounts,
  type InvoiceAmounts,
} from '../domain/invoices/invoice.calculations.js'
import {
  canTransitionTo,
  isInvoiceOverdue,
} from '../domain/invoices/invoice.rules.js'
import type {
  Invoice,
  InvoiceStatus,
  PaymentMethod,
} from '../domain/invoices/invoice.types.js'
import {
  getInvoiceEmissionErrors,
  getInvoicePaymentErrors,
} from '../domain/invoices/invoice.validation.js'
import { AppError } from '../errors/app.error.js'
import {
  findAllInvoices,
  findInvoiceById,
  updateInvoiceStatus as persistInvoiceStatus,
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

export interface InvoiceDetails
  extends Invoice,
    InvoiceAmounts {
  isOverdue: boolean
}

export type UpdateInvoiceStatusInput =
  | {
      status: 'issued'
    }
  | {
      status: 'sent'
    }
  | {
      status: 'paid'
      payment: {
        amountCents: number
        method: PaymentMethod
        reference?: string
      }
    }
  | {
      status: 'credited'
      creditNote: {
        reason: string
      }
    }

function getCurrentDateInFrance(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function enrichInvoice(
  invoice: Invoice,
  currentDate: string,
): InvoiceDetails {
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

  return enrichInvoice(invoice, currentDate)
}

export function changeInvoiceStatus(
  invoiceId: string,
  input: UpdateInvoiceStatusInput,
  occurredAt = new Date().toISOString(),
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

  if (!canTransitionTo(invoice.status, input.status)) {
    throw new AppError(
      409,
      'INVALID_STATUS_TRANSITION',
      `La transition de ${invoice.status} vers ${input.status} est interdite.`,
    )
  }

  let updatedInvoice: Invoice | undefined

  if (input.status === 'issued') {
    const errors = getInvoiceEmissionErrors(invoice)

    if (errors.length > 0) {
      throw new AppError(
        422,
        'INVOICE_NOT_READY',
        'La facture ne peut pas être émise.',
        errors,
      )
    }

    updatedInvoice = persistInvoiceStatus({
      invoiceId,
      expectedStatus: invoice.status,
      nextStatus: 'issued',
      occurredAt,
    })
  }

  if (input.status === 'sent') {
    updatedInvoice = persistInvoiceStatus({
      invoiceId,
      expectedStatus: invoice.status,
      nextStatus: 'sent',
      occurredAt,
    })
  }

  if (input.status === 'paid') {
    const newAmountPaidCents =
      invoice.amountPaidCents +
      input.payment.amountCents

    const invoiceAfterPayment: Invoice = {
      ...invoice,
      amountPaidCents: newAmountPaidCents,
      paymentMethod: input.payment.method,
      paymentReference:
        input.payment.reference,
    }

    const errors = getInvoicePaymentErrors(
      invoiceAfterPayment,
    )

    if (errors.length > 0) {
      throw new AppError(
        422,
        'INVOICE_PAYMENT_INVALID',
        'Le règlement fourni est invalide.',
        errors,
      )
    }

    updatedInvoice = persistInvoiceStatus({
      invoiceId,
      expectedStatus: invoice.status,
      nextStatus: 'paid',
      occurredAt,
      amountPaidCents: newAmountPaidCents,
      paymentMethod: input.payment.method,
      paymentReference:
        input.payment.reference,
    })
  }

  if (input.status === 'credited') {
    updatedInvoice = persistInvoiceStatus({
      invoiceId,
      expectedStatus: invoice.status,
      nextStatus: 'credited',
      occurredAt,
      creditNoteReason:
        input.creditNote.reason,
    })
  }

  if (updatedInvoice === undefined) {
    throw new AppError(
      409,
      'INVOICE_CONCURRENT_UPDATE',
      'La facture a été modifiée par une autre opération. Veuillez réessayer.',
    )
  }

  return enrichInvoice(
    updatedInvoice,
    currentDate,
  )
}