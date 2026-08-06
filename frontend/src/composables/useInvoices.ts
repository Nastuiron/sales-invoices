import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

import {
  ApiError,
} from '../api/apiError'
import {
  invoiceApi,
  type InvoiceRequestOptions,
} from '../api/invoiceApi'
import type {
  InvoiceFilters,
  InvoiceStatus,
  InvoiceSummary,
} from '../types/invoice'

export function useInvoices() {
  const invoices = ref<InvoiceSummary[]>([])
  const search = ref('')
  const selectedStatus =
    ref<InvoiceStatus | 'all'>('all')

  const isLoading = ref(false)
  const loadError = ref<ApiError | null>(null)

  const total = computed(
    () => invoices.value.length,
  )

  const hasActiveFilters = computed(
    () =>
      search.value.trim() !== '' ||
      selectedStatus.value !== 'all',
  )

  const filters = computed<InvoiceFilters>(
    () => {
      const result: InvoiceFilters = {}

      const normalizedSearch =
        search.value.trim()

      if (normalizedSearch !== '') {
        result.search = normalizedSearch
      }

      if (selectedStatus.value !== 'all') {
        result.status = selectedStatus.value
      }

      return result
    },
  )

  let latestRequestId = 0
  let searchTimer:
    | ReturnType<typeof setTimeout>
    | undefined

  async function loadInvoices(
    options: InvoiceRequestOptions = {},
  ): Promise<void> {
    const requestId = ++latestRequestId

    isLoading.value = true
    loadError.value = null

    try {
      const response =
        await invoiceApi.getInvoices(
          filters.value,
          options,
        )

      if (requestId === latestRequestId) {
        invoices.value = response.data
      }
    } catch (error: unknown) {
      if (requestId !== latestRequestId) {
        return
      }

      loadError.value =
        error instanceof ApiError
          ? error
          : new ApiError(
              'UNKNOWN_ERROR',
              'Une erreur inattendue est survenue.',
            )
    } finally {
      if (requestId === latestRequestId) {
        isLoading.value = false
      }
    }
  }

  function scheduleReload(): void {
    if (searchTimer !== undefined) {
      clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(() => {
      void loadInvoices()
    }, 350)
  }

  function clearFilters(): void {
    search.value = ''
    selectedStatus.value = 'all'
  }

  watch(
    [search, selectedStatus],
    scheduleReload,
  )

  onMounted(() => {
    void loadInvoices()
  })

  onUnmounted(() => {
    if (searchTimer !== undefined) {
      clearTimeout(searchTimer)
    }
  })

  return {
    invoices,
    search,
    selectedStatus,
    isLoading,
    loadError,
    total,
    hasActiveFilters,

    loadInvoices,
    clearFilters,

    simulateError: () =>
      loadInvoices({
        simulateError: true,
      }),
  }
}