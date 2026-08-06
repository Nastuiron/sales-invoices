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
  getInvoiceDetailsMock,
  getInvoiceSummariesMock,
} = vi.hoisted(() => ({
  getInvoiceDetailsMock: vi.fn(),
  getInvoiceSummariesMock: vi.fn(),
}))

vi.mock(
  '../src/services/invoice.service.js',
  () => ({
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