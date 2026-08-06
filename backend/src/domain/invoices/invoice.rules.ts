import { calculateInvoiceAmounts } from './invoice.calculations.js'
import type {
  Invoice,
  InvoiceStatus,
} from './invoice.types.js'

export const ALLOWED_STATUS_TRANSITIONS = {
  draft: ['issued'],
  issued: ['sent', 'credited'],
  sent: ['paid', 'credited'],
  paid: [],
  credited: [],
} as const satisfies Record<InvoiceStatus, readonly InvoiceStatus[]>

export function canTransitionTo(
  currentStatus: InvoiceStatus,
  nextStatus: InvoiceStatus,
): boolean {
  const allowedStatuses: readonly InvoiceStatus[] =
    ALLOWED_STATUS_TRANSITIONS[currentStatus]

  return allowedStatuses.includes(nextStatus)
}

export function isInvoiceOverdue(
  invoice: Invoice,
  currentDate: string,
): boolean {
  if (
    invoice.status !== 'sent' ||
    invoice.dueDate === undefined
  ) {
    return false
  }

  const { remainingAmountCents } =
    calculateInvoiceAmounts(invoice)

  return (
    invoice.dueDate < currentDate &&
    remainingAmountCents > 0
  )
}