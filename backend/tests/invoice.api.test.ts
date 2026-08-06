import request from 'supertest'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { AppError } from '../src/errors/app.error.js'

const {
  changeInvoiceStatusMock,
  getInvoiceDetailsMock,
  getInvoiceSummariesMock,
} = vi.hoisted(() => ({
  changeInvoiceStatusMock: vi.fn(),
  getInvoiceDetailsMock: vi.fn(),
  getInvoiceSummariesMock: vi.fn(),
}))

vi.mock(
  '../src/services/invoice.service.js',
  () => ({
    changeInvoiceStatus: changeInvoiceStatusMock,
    getInvoiceDetails: getInvoiceDetailsMock,
    getInvoiceSummaries: getInvoiceSummariesMock,
  }),
)

import { app } from '../src/app.js'

describe('GET /api/invoices', () => {
  beforeEach(() => {
    getInvoiceSummariesMock.mockReset()
    getInvoiceSummariesMock.mockReturnValue([])
  })

  it('returns the invoice list', async () => {
    const response = await request(app)
      .get('/api/invoices')
      .expect(200)

    expect(response.body).toEqual({
      data: [],
      meta: {
        count: 0,
      },
    })

    expect(getInvoiceSummariesMock).toHaveBeenCalledWith({})
  })

  it('passes search and status filters to the service', async () => {
    await request(app)
      .get('/api/invoices')
      .query({
        search: '  nova  ',
        status: 'sent',
      })
      .expect(200)

    expect(getInvoiceSummariesMock).toHaveBeenCalledWith({
      search: 'nova',
      status: 'sent',
    })
  })

  it('rejects an invalid status', async () => {
    const response = await request(app)
      .get('/api/invoices')
      .query({
        status: 'incorrect',
      })
      .expect(400)

    expect(response.body.error.code).toBe(
      'INVALID_QUERY_PARAMETERS',
    )

    expect(getInvoiceSummariesMock).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown route', async () => {
    const response = await request(app)
      .get('/api/unknown')
      .expect(404)

    expect(response.body.error.code).toBe(
      'ROUTE_NOT_FOUND',
    )
  })

  it('returns a simulated API error when requested', async () => {
    const response = await request(app)
      .get('/api/invoices')
      .set('x-simulate-api-error', 'true')
      .expect(503)

    expect(response.body.error).toEqual({
      code: 'SIMULATED_API_ERROR',
      message: 'Une erreur API a été simulée.',
    })

    expect(
      getInvoiceSummariesMock,
    ).not.toHaveBeenCalled()
  })
})

describe('GET /api/invoices/:id', () => {
  beforeEach(() => {
    getInvoiceDetailsMock.mockReset()
  })

  it('returns the requested invoice', async () => {
    const invoiceDetails = {
      id: 'invoice-overdue',
      status: 'sent',
      isOverdue: true,
    }

    getInvoiceDetailsMock.mockReturnValue(
      invoiceDetails,
    )

    const response = await request(app)
      .get('/api/invoices/invoice-overdue')
      .expect(200)

    expect(response.body).toEqual({
      data: invoiceDetails,
    })

    expect(
      getInvoiceDetailsMock,
    ).toHaveBeenCalledWith('invoice-overdue')
  })

  it('rejects an invalid invoice identifier', async () => {
    const response = await request(app)
      .get('/api/invoices/invalid%20identifier')
      .expect(400)

    expect(response.body.error.code).toBe(
      'INVALID_INVOICE_ID',
    )

    expect(
      getInvoiceDetailsMock,
    ).not.toHaveBeenCalled()
  })

  it('returns 404 when the invoice does not exist', async () => {
    getInvoiceDetailsMock.mockImplementationOnce(() => {
      throw new AppError(
        404,
        'INVOICE_NOT_FOUND',
        "La facture demandée n'existe pas.",
      )
    })

    const response = await request(app)
      .get('/api/invoices/invoice-inexistante')
      .expect(404)

    expect(response.body.error).toEqual({
      code: 'INVOICE_NOT_FOUND',
      message: "La facture demandée n'existe pas.",
    })
  })
})

describe('PATCH /api/invoices/:id/status', () => {
  beforeEach(() => {
    changeInvoiceStatusMock.mockReset()
  })

  it('updates an invoice status', async () => {
    const updatedInvoice = {
      id: 'invoice-partially-paid',
      status: 'paid',
      remainingAmountCents: 0,
    }

    changeInvoiceStatusMock.mockReturnValue(
      updatedInvoice,
    )

    const requestBody = {
      status: 'paid',
      payment: {
        amountCents: 30_000,
        method: 'bank_transfer',
        reference: 'VIR-2026-001',
      },
    }

    const response = await request(app)
      .patch(
        '/api/invoices/invoice-partially-paid/status',
      )
      .send(requestBody)
      .expect(200)

    expect(response.body).toEqual({
      data: updatedInvoice,
      message:
        'Le statut de la facture a été mis à jour.',
    })

    expect(
      changeInvoiceStatusMock,
    ).toHaveBeenCalledWith(
      'invoice-partially-paid',
      requestBody,
    )
  })

  it('rejects missing payment information', async () => {
    const response = await request(app)
      .patch('/api/invoices/invoice-1/status')
      .send({
        status: 'paid',
      })
      .expect(400)

    expect(response.body.error.code).toBe(
      'INVALID_STATUS_UPDATE',
    )

    expect(
      changeInvoiceStatusMock,
    ).not.toHaveBeenCalled()
  })

  it('returns a business transition error', async () => {
    changeInvoiceStatusMock.mockImplementationOnce(
      () => {
        throw new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          'Cette transition est interdite.',
        )
      },
    )

    const response = await request(app)
      .patch('/api/invoices/invoice-1/status')
      .send({
        status: 'sent',
      })
      .expect(409)

    expect(response.body.error.code).toBe(
      'INVALID_STATUS_TRANSITION',
    )
  })

  it('returns 400 when the JSON body is malformed', async () => {
    const response = await request(app)
      .patch('/api/invoices/invoice-1/status')
      .set('Content-Type', 'application/json')
      .send('{"status":')
      .expect(400)

    expect(response.body.error).toEqual({
      code: 'INVALID_JSON',
      message:
        'Le corps de la requête contient un JSON invalide.',
    })
  })
})