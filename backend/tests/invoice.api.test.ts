import request from 'supertest'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const { getInvoiceSummariesMock } = vi.hoisted(() => ({
  getInvoiceSummariesMock: vi.fn(),
}))

vi.mock(
  '../src/services/invoice.service.js',
  () => ({
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