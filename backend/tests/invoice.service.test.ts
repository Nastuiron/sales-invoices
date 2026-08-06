import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { AppError } from '../src/errors/app.error.js'
import type {
  Invoice,
} from '../src/domain/invoices/invoice.types.js'

const {
  findAllInvoicesMock,
  findInvoiceByIdMock,
  persistInvoiceStatusMock,
} = vi.hoisted(() => ({
  findAllInvoicesMock: vi.fn(),
  findInvoiceByIdMock: vi.fn(),
  persistInvoiceStatusMock: vi.fn(),
}))

vi.mock(
  '../src/repositories/invoice.repository.js',
  () => ({
    findAllInvoices: findAllInvoicesMock,
    findInvoiceById: findInvoiceByIdMock,
    updateInvoiceStatus:
      persistInvoiceStatusMock,
  }),
)

import {
  changeInvoiceStatus,
} from '../src/services/invoice.service.js'

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
    },

    lines: [
      {
        id: 'line-1',
        description: 'Prestation de développement',
        quantity: 1,
        unitPriceCents: 50_000,
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

function expectAppError(
  action: () => unknown,
  expectedCode: string,
): void {
  try {
    action()

    throw new Error(
      `L'erreur ${expectedCode} était attendue.`,
    )
  } catch (error) {
    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).code).toBe(
      expectedCode,
    )
  }
}

describe('changeInvoiceStatus', () => {
  beforeEach(() => {
    findAllInvoicesMock.mockReset()
    findInvoiceByIdMock.mockReset()
    persistInvoiceStatusMock.mockReset()
  })

  it('rejects a forbidden transition', () => {
    findInvoiceByIdMock.mockReturnValue(
      createInvoice({
        status: 'issued',
        invoiceNumber: 'FAC-2026-0001',
      }),
    )

    expectAppError(
      () =>
        changeInvoiceStatus(
          'invoice-1',
          {
            status: 'paid',
            payment: {
              amountCents: 60_000,
              method: 'bank_transfer',
            },
          },
          '2026-08-06T10:00:00.000Z',
          '2026-08-06',
        ),
      'INVALID_STATUS_TRANSITION',
    )

    expect(
      persistInvoiceStatusMock,
    ).not.toHaveBeenCalled()
  })

  it('rejects an incomplete draft invoice', () => {
    findInvoiceByIdMock.mockReturnValue(
      createInvoice({
        lines: [],
      }),
    )

    expectAppError(
      () =>
        changeInvoiceStatus(
          'invoice-1',
          {
            status: 'issued',
          },
          '2026-08-06T10:00:00.000Z',
          '2026-08-06',
        ),
      'INVOICE_NOT_READY',
    )

    expect(
      persistInvoiceStatusMock,
    ).not.toHaveBeenCalled()
  })

  it('adds a final payment to an existing partial payment', () => {
    const sentInvoice = createInvoice({
      status: 'sent',
      amountPaidCents: 30_000,
    })

    const paidInvoice = createInvoice({
      status: 'paid',
      amountPaidCents: 60_000,
      paymentMethod: 'bank_transfer',
      paymentReference: 'VIR-2026-001',
      paidAt: '2026-08-06T10:00:00.000Z',
    })

    findInvoiceByIdMock.mockReturnValue(
      sentInvoice,
    )

    persistInvoiceStatusMock.mockReturnValue(
      paidInvoice,
    )

    const result = changeInvoiceStatus(
      'invoice-1',
      {
        status: 'paid',
        payment: {
          amountCents: 30_000,
          method: 'bank_transfer',
          reference: 'VIR-2026-001',
        },
      },
      '2026-08-06T10:00:00.000Z',
      '2026-08-06',
    )

    expect(
      persistInvoiceStatusMock,
    ).toHaveBeenCalledWith({
      invoiceId: 'invoice-1',
      expectedStatus: 'sent',
      nextStatus: 'paid',
      occurredAt: '2026-08-06T10:00:00.000Z',
      amountPaidCents: 60_000,
      paymentMethod: 'bank_transfer',
      paymentReference: 'VIR-2026-001',
    })

    expect(result.status).toBe('paid')
    expect(result.remainingAmountCents).toBe(0)
  })

  it('detects a concurrent update', () => {
    findInvoiceByIdMock.mockReturnValue(
      createInvoice(),
    )

    persistInvoiceStatusMock.mockReturnValue(
      undefined,
    )

    expectAppError(
      () =>
        changeInvoiceStatus(
          'invoice-1',
          {
            status: 'issued',
          },
          '2026-08-06T10:00:00.000Z',
          '2026-08-06',
        ),
      'INVOICE_CONCURRENT_UPDATE',
    )
  })
})