import {
  flushPromises,
  mount,
} from '@vue/test-utils'
import {
  defineComponent,
  nextTick,
} from 'vue'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  invoiceApi,
} from '../src/api/invoiceApi'
import {
  useInvoices,
} from '../src/composables/useInvoices'

vi.mock('../src/api/invoiceApi', () => ({
  invoiceApi: {
    getInvoices: vi.fn(),
  },
}))

const mockedGetInvoices =
  vi.mocked(invoiceApi.getInvoices)

async function mountComposable() {
  let invoicesState:
    | ReturnType<typeof useInvoices>
    | undefined

  const TestComponent = defineComponent({
    setup() {
      invoicesState = useInvoices()

      return () => null
    },
  })

  const wrapper = mount(TestComponent)

  await flushPromises()

  if (invoicesState === undefined) {
    throw new Error(
      'Le composable useInvoices n’a pas été initialisé.',
    )
  }

  mockedGetInvoices.mockClear()

  return {
    wrapper,
    invoicesState,
  }
}

describe('useInvoices', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    mockedGetInvoices.mockResolvedValue({
      data: [],
      meta: {
        count: 0,
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('combines a trimmed search and status after 350 ms', async () => {
    const {
      wrapper,
      invoicesState,
    } = await mountComposable()

    invoicesState.search.value = '  Nova  '
    invoicesState.selectedStatus.value = 'sent'

    await nextTick()
    await vi.advanceTimersByTimeAsync(349)

    expect(mockedGetInvoices).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(mockedGetInvoices).toHaveBeenCalledOnce()
    expect(mockedGetInvoices).toHaveBeenCalledWith(
      {
        search: 'Nova',
        status: 'sent',
      },
      {},
    )

    wrapper.unmount()
  })

  it('restarts the delay when the search changes', async () => {
    const {
      wrapper,
      invoicesState,
    } = await mountComposable()

    invoicesState.search.value = 'No'
    await nextTick()

    await vi.advanceTimersByTimeAsync(200)

    invoicesState.search.value = 'Nova'
    await nextTick()

    await vi.advanceTimersByTimeAsync(349)

    expect(mockedGetInvoices).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(mockedGetInvoices).toHaveBeenCalledOnce()
    expect(mockedGetInvoices).toHaveBeenCalledWith(
      {
        search: 'Nova',
      },
      {},
    )

    wrapper.unmount()
  })
})