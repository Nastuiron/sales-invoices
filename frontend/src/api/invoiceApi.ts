import type {
  AxiosRequestConfig,
} from 'axios'

import { httpClient } from './httpClient'
import type {
  ApiListResponse,
  ApiResponse,
  InvoiceDetails,
  InvoiceFilters,
  InvoiceSummary,
  UpdateInvoiceStatusInput,
} from '../types/invoice'

export interface InvoiceRequestOptions {
  simulateError?: boolean
}

function createRequestConfig(
  options: InvoiceRequestOptions = {},
): AxiosRequestConfig {
  if (options.simulateError !== true) {
    return {}
  }

  return {
    headers: {
      'x-simulate-api-error': 'true',
    },
  }
}

export const invoiceApi = {
  async getInvoices(
    filters: InvoiceFilters = {},
    options: InvoiceRequestOptions = {},
  ): Promise<ApiListResponse<InvoiceSummary>> {
    const response = await httpClient.get<
      ApiListResponse<InvoiceSummary>
    >('/invoices', {
      ...createRequestConfig(options),
      params: filters,
    })

    return response.data
  },

  async getInvoice(
    invoiceId: string,
  ): Promise<InvoiceDetails> {
    const response = await httpClient.get<
      ApiResponse<InvoiceDetails>
    >(`/invoices/${invoiceId}`)

    return response.data.data
  },

  async updateStatus(
    invoiceId: string,
    input: UpdateInvoiceStatusInput,
  ): Promise<ApiResponse<InvoiceDetails>> {
    const response = await httpClient.patch<
      ApiResponse<InvoiceDetails>
    >(
      `/invoices/${invoiceId}/status`,
      input,
    )

    return response.data
  },
}