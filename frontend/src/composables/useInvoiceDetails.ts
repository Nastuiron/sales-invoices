import {
  ref,
} from 'vue'

import {
  invoiceApi,
} from '../api/invoiceApi'
import {
  normalizeApiError,
} from '../api/apiError'
import type {
  InvoiceDetails,
} from '../types/invoice'

export function useInvoiceDetails(){
    const invoice = ref<InvoiceDetails | null>(null)
    const isLoading = ref(false)
    const errorMessage = ref<string | null>(null)

    let requestId = 0

    async function loadInvoice(id: string) {
        const currentRequestId = ++requestId

        isLoading.value = true
        errorMessage.value = null
        invoice.value = null

        try {
            const result = await invoiceApi.getInvoice(id)

            if (currentRequestId === requestId) {
                invoice.value = result
            }
        } catch (error) {
            if (currentRequestId === requestId) {
                errorMessage.value = normalizeApiError(error).message
            }
        } finally {
            if (currentRequestId === requestId) {
                isLoading.value = false
            }
        }
    }

    function closeInvoice() {
        requestId += 1
        invoice.value = null
        errorMessage.value = null
        isLoading.value = false
    }

    return {
        invoice,
        isLoading,
        errorMessage,
        loadInvoice,
        closeInvoice
    }
}