import { describe, expect, it } from 'vitest'

import {
  calculateInvoiceAmounts,
  calculateInvoiceLineAmounts,
} from '../src/domain/invoices/invoice.calculations.js'
import {
  canTransitionTo,
  isInvoiceOverdue,
} from '../src/domain/invoices/invoice.rules.js'
import type {
  Invoice,
  InvoiceStatus,
} from '../src/domain/invoices/invoice.types.js'
import {
  canIssueInvoice,
  canMarkInvoiceAsPaid,
} from '../src/domain/invoices/invoice.validation.js'

function createInvoice(
  overrides: Partial<Invoice> = {},
): Invoice {
  return {
    id: 'invoice-1',
    status: 'draft',
    customer: {
      id: 'customer-1',
      name: 'Entreprise Exemple',
      email: 'contact@example.fr',
      billingAddress: {
        street: '10 rue de Paris',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
      },
      vatNumber: 'FR12345678901',
    },
    lines: [
      {
        id: 'line-1',
        description: 'Prestation de développement',
        quantity: 2,
        unitPriceCents: 10_000,
        vatRate: 20,
      },
    ],
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    currency: 'EUR',
    amountPaidCents: 0,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
    ...overrides,
  }
}

describe('invoice calculations', () => {
  it('calculates the amounts of one invoice line', () => {
    const amounts = calculateInvoiceLineAmounts({
      id: 'line-1',
      description: 'Développement',
      quantity: 2,
      unitPriceCents: 10_000,
      vatRate: 20,
    })

    expect(amounts).toEqual({
      subtotalCents: 20_000,
      vatAmountCents: 4_000,
      totalCents: 24_000,
    })
  })

  it('calculates invoice totals and remaining amount', () => {
    const invoice = createInvoice({
      amountPaidCents: 4_000,
    })

    expect(calculateInvoiceAmounts(invoice)).toEqual({
      subtotalCents: 20_000,
      vatAmountCents: 4_000,
      totalCents: 24_000,
      remainingAmountCents: 20_000,
    })
  })
})

describe('invoice status transitions', () => {
  it('allows a draft invoice to be issued', () => {
    expect(canTransitionTo('draft', 'issued')).toBe(true)
  })

  it('prevents an issued invoice from being paid directly', () => {
    expect(canTransitionTo('issued', 'paid')).toBe(false)
  })

  it.each<InvoiceStatus>([
    'draft',
    'issued',
    'sent',
    'paid',
    'credited',
  ])(
    'prevents every transition from the terminal credited status to %s',
    (nextStatus) => {
      expect(canTransitionTo('credited', nextStatus)).toBe(false)
    },
  )
})

describe('invoice overdue rule', () => {
  it('detects an unpaid sent invoice after its due date', () => {
    const invoice = createInvoice({
      status: 'sent',
      dueDate: '2026-08-04',
    })

    expect(isInvoiceOverdue(invoice, '2026-08-05')).toBe(true)
  })

  it('does not consider a fully paid invoice overdue', () => {
    const invoice = createInvoice({
      status: 'sent',
      dueDate: '2026-08-04',
      amountPaidCents: 24_000,
    })

    expect(isInvoiceOverdue(invoice, '2026-08-05')).toBe(false)
  })
})

describe('invoice validation', () => {
  it('allows a complete draft invoice to be issued', () => {
    expect(canIssueInvoice(createInvoice())).toBe(true)
  })

  it('prevents an invoice without lines from being issued', () => {
    const invoice = createInvoice({
      lines: [],
    })

    expect(canIssueInvoice(invoice)).toBe(false)
  })

  it('allows a fully paid sent invoice to be marked as paid', () => {
    const invoice = createInvoice({
      status: 'sent',
      amountPaidCents: 24_000,
      paymentMethod: 'bank_transfer',
    })

    expect(canMarkInvoiceAsPaid(invoice)).toBe(true)
  })

  it('prevents a partially paid invoice from being marked as paid', () => {
    const invoice = createInvoice({
      status: 'sent',
      amountPaidCents: 10_000,
      paymentMethod: 'bank_transfer',
    })

    expect(canMarkInvoiceAsPaid(invoice)).toBe(false)
  })
})