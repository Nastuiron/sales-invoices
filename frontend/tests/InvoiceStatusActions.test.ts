import {
  mount,
} from '@vue/test-utils'
import {
  describe,
  expect,
  it,
} from 'vitest'

import InvoiceStatusActions from '../src/components/invoices/InvoiceStatusActions.vue'
import type {
  InvoiceDetails,
  InvoiceStatus,
} from '../src/types/invoice.ts'

function createInvoice(
  status: InvoiceStatus,
): InvoiceDetails {
  return {
    id: 'invoice-test',
    invoiceNumber: 'FAC-2026-TEST',
    status,

    customer: {
      id: 'customer-test',
      name: 'Client Test',
      email: 'client@example.com',

      billingAddress: {
        street: '1 rue du Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
      },
    },

    lines: [
      {
        id: 'line-test',
        description: 'Prestation de test',
        quantity: 1,
        unitPriceCents: 10000,
        vatRate: 20,
      },
    ],

    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    currency: 'EUR',
    amountPaidCents:
      status === 'paid' ? 12000 : 0,

    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',

    subtotalCents: 10000,
    vatAmountCents: 2000,
    totalCents: 12000,
    remainingAmountCents:
      status === 'paid' ? 0 : 12000,

    isOverdue: false,
  }
}

function mountActions(
  status: InvoiceStatus,
) {
  return mount(InvoiceStatusActions, {
    props: {
      invoice: createInvoice(status),
      isUpdating: false,
      errorMessage: null,
    },
  })
}

function getButtonLabels(
  wrapper: ReturnType<typeof mountActions>,
): string[] {
  return wrapper
    .findAll('button')
    .map((button) => button.text())
}

describe('InvoiceStatusActions', () => {
  it('only allows issuing a draft invoice', () => {
    const wrapper = mountActions('draft')

    expect(getButtonLabels(wrapper)).toEqual([
      'Émettre la facture',
    ])
  })

  it('allows sending or crediting an issued invoice', () => {
    const wrapper = mountActions('issued')

    expect(getButtonLabels(wrapper)).toEqual([
      'Marquer comme envoyée',
      'Créer un avoir',
    ])
  })

  it('allows paying or crediting a sent invoice', () => {
    const wrapper = mountActions('sent')

    expect(getButtonLabels(wrapper)).toEqual([
      'Enregistrer le paiement',
      'Créer un avoir',
    ])
  })

  it.each([
    'paid',
    'credited',
  ] as const)(
    'does not offer a transition for a %s invoice',
    (status) => {
      const wrapper = mountActions(status)

      expect(wrapper.findAll('button')).toHaveLength(0)
      expect(wrapper.text()).toContain(
        'Cette facture ne dispose plus d’action',
      )
    },
  )
})