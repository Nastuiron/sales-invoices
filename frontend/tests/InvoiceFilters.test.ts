import {
  mount,
} from '@vue/test-utils'
import {
  describe,
  expect,
  it,
} from 'vitest'

import InvoiceFilters from '../src/components/invoices/InvoiceFilters.vue'

function mountFilters(
  hasActiveFilters = false,
) {
  return mount(InvoiceFilters, {
    props: {
      search: '',
      status: 'all',
      hasActiveFilters,
    },
  })
}

describe('InvoiceFilters', () => {
  it('emits the entered search value', async () => {
    const wrapper = mountFilters()
    const input = wrapper.get(
      '#invoice-search',
    )

    await input.setValue('Nova')

    expect(
      wrapper.emitted('update:search'),
    ).toEqual([
      ['Nova'],
    ])
  })

  it('emits the selected status', async () => {
    const wrapper = mountFilters()
    const select = wrapper.get(
      '#invoice-status',
    )

    await select.setValue('sent')

    expect(
      wrapper.emitted('update:status'),
    ).toEqual([
      ['sent'],
    ])
  })

  it('only displays reset when filters are active', () => {
    const inactiveWrapper = mountFilters(false)
    const activeWrapper = mountFilters(true)

    expect(
      inactiveWrapper.find(
        '.invoice-filters__clear',
      ).exists(),
    ).toBe(false)

    expect(
      activeWrapper.find(
        '.invoice-filters__clear',
      ).exists(),
    ).toBe(true)
  })

  it('emits clear when reset is requested', async () => {
    const wrapper = mountFilters(true)

    await wrapper
      .get('.invoice-filters__clear')
      .trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})