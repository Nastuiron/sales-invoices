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
  UpdateInvoiceStatusInput,
} from '../types/invoice'

export function useInvoiceDetails() {
  const invoice = ref<InvoiceDetails | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  const isUpdating = ref(false)
  const actionErrorMessage = ref<string | null>(null)

  let loadRequestId = 0
  let actionRequestId = 0

  async function loadInvoice(
    id: string,
  ): Promise<void> {
    const currentRequestId = ++loadRequestId

    isLoading.value = true
    errorMessage.value = null
    actionErrorMessage.value = null
    invoice.value = null

    try {
      const result = await invoiceApi.getInvoice(id)

      if (currentRequestId === loadRequestId) {
        invoice.value = result
      }
    } catch (error: unknown) {
      if (currentRequestId === loadRequestId) {
        errorMessage.value =
          normalizeApiError(error).message
      }
    } finally {
      if (currentRequestId === loadRequestId) {
        isLoading.value = false
      }
    }
  }

  async function updateInvoiceStatus(
    input: UpdateInvoiceStatusInput,
  ): Promise<boolean> {
    if (
      invoice.value === null
      || isUpdating.value
    ) {
      return false
    }

    const invoiceId = invoice.value.id
    const currentRequestId = ++actionRequestId

    isUpdating.value = true
    actionErrorMessage.value = null

    try {
      const response =
        await invoiceApi.updateStatus(
          invoiceId,
          input,
        )

      if (
        currentRequestId !== actionRequestId
        || invoice.value?.id !== invoiceId
      ) {
        return false
      }

      invoice.value = response.data

      return true
    } catch (error: unknown) {
      if (currentRequestId === actionRequestId) {
        actionErrorMessage.value =
          normalizeApiError(error).message
      }

      return false
    } finally {
      if (currentRequestId === actionRequestId) {
        isUpdating.value = false
      }
    }
  }

  function clearActionError(): void {
    actionErrorMessage.value = null
  }

  function closeInvoice(): void {
    loadRequestId += 1
    actionRequestId += 1

    invoice.value = null
    errorMessage.value = null
    actionErrorMessage.value = null
    isLoading.value = false
    isUpdating.value = false
  }

  return {
    invoice,
    isLoading,
    errorMessage,
    isUpdating,
    actionErrorMessage,
    loadInvoice,
    updateInvoiceStatus,
    clearActionError,
    closeInvoice,
  }
}