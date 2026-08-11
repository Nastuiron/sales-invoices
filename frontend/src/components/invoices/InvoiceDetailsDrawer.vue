<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

import InvoiceStatusBadge from './InvoiceStatusBadge.vue'
import {
  formatCurrency,
  formatDate,
} from '../../utils/formatters'
import type {
  InvoiceDetails,
  UpdateInvoiceStatusInput,
} from '../../types/invoice'
import InvoiceStatusActions from './InvoiceStatusActions.vue'

const props = defineProps<{
  isOpen: boolean
  invoice: InvoiceDetails | null
  isLoading: boolean
  errorMessage: string | null
  isUpdating: boolean
  actionErrorMessage: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  close: []
  retry: []
  updateStatus: [input: UpdateInvoiceStatusInput]
  clearActionError: []
}>()

const closeButton = ref<HTMLButtonElement | null>(null)

const drawerElement = ref<HTMLElement | null>(null)

const paymentMethodLabels = {
  bank_transfer: 'Virement bancaire',
  card: 'Carte bancaire',
  direct_debit: 'Prélèvement',
  cheque: 'Chèque',
} as const

function close() {
  emit('close')
}

function handleKeydown(
  event: KeyboardEvent,
): void {
  if (
    event.key === 'Escape'
    && props.isOpen
  ) {
    close()
    return
  }

  if (
    event.key !== 'Tab'
    || drawerElement.value === null
  ) {
    return
  }

  const focusableElements = Array.from(
    drawerElement.value.querySelectorAll<HTMLElement>(
      [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(','),
    ),
  )

  if (focusableElements.length === 0) {
    event.preventDefault()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement =
    focusableElements[focusableElements.length - 1]

  if (
    event.shiftKey
    && document.activeElement === firstElement
  ) {
    event.preventDefault()
    lastElement?.focus()
  } else if (
    !event.shiftKey
    && document.activeElement === lastElement
  ) {
    event.preventDefault()
    firstElement?.focus()
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {

      document.body.style.overflow = 'hidden'

      document.addEventListener(
        'keydown',
        handleKeydown,
      )

      await nextTick()
      closeButton.value?.focus()
    } else {
      document.body.style.removeProperty('overflow')

      document.removeEventListener(
        'keydown',
        handleKeydown,
      )
    }
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  document.body.style.removeProperty('overflow')
  document.removeEventListener(
    'keydown',
    handleKeydown,
  )
})

function lineSubtotalCents(
  quantity: number,
  unitPriceCents: number,
) {
  return Math.round(quantity * unitPriceCents)
}

function lineVatCents(
  quantity: number,
  unitPriceCents: number,
  vatRate: number,
) {
  const subtotalCents = lineSubtotalCents(
    quantity,
    unitPriceCents,
  )

  return Math.round(
    subtotalCents * vatRate / 100,
  )
}

function lineTotalCents(
  quantity: number,
  unitPriceCents: number,
  vatRate: number,
) {
  const subtotalCents = lineSubtotalCents(
    quantity,
    unitPriceCents,
  )

  return subtotalCents + lineVatCents(
    quantity,
    unitPriceCents,
    vatRate,
  )
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="drawer-layer"
    >
      <button
        class="drawer-backdrop"
        type="button"
        :tabindex="-1"
        aria-label="Fermer le détail de la facture"
        @click="close"
      />

      <aside
        ref="drawerElement"
        class="invoice-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-drawer-title"
      >
        <header class="drawer-header">
          <div>
            <p class="drawer-eyebrow">
              Détail de la facture
            </p>

            <h2 id="invoice-drawer-title">
              {{ invoice?.invoiceNumber ?? 'Brouillon' }}
            </h2>
          </div>

          <button
            ref="closeButton"
            class="drawer-close"
            type="button"
            aria-label="Fermer"
            @click="close"
          >
            ×
          </button>
        </header>

        <div
          v-if="isLoading"
          class="drawer-state"
          role="status"
        >
          Chargement de la facture…
        </div>

        <div
          v-else-if="errorMessage"
          class="drawer-state drawer-error"
          role="alert"
        >
          <p>{{ errorMessage }}</p>

          <button
            type="button"
            class="secondary-button"
            @click="emit('retry')"
          >
            Réessayer
          </button>
        </div>

        <div
          v-else-if="invoice"
          class="drawer-content"
        >
          <section class="drawer-summary">
            <InvoiceStatusBadge
              :status="invoice.status"
              :is-overdue="invoice.isOverdue"
            />

            <dl class="summary-grid">
              <div>
                <dt>Date d’émission</dt>
                <dd>
                  {{
                    invoice.issueDate
                      ? formatDate(invoice.issueDate)
                      : 'Non émise'
                  }}
                </dd>
              </div>

              <div>
                <dt>Date d’échéance</dt>
                <dd>
                  {{
                    invoice.dueDate
                      ? formatDate(invoice.dueDate)
                      : 'Non définie'
                  }}
                </dd>
              </div>

              <div>
                <dt>Référence de commande</dt>
                <dd>
                  {{
                    invoice.purchaseOrderReference
                      ?? 'Aucune'
                  }}
                </dd>
              </div>
            </dl>
          </section>
          <p
            v-if="successMessage"
            class="drawer-success"
            role="status"
            aria-live="polite"
          >
            {{ successMessage }}
          </p>
          <InvoiceStatusActions
            :invoice="invoice"
            :is-updating="isUpdating"
            :error-message="actionErrorMessage"
            @submit="emit('updateStatus', $event)"
            @clear-error="emit('clearActionError')"
          />
          <section class="drawer-section">
            <h3>Client</h3>

            <address>
              <strong>{{ invoice.customer.name }}</strong>
              <span>{{ invoice.customer.email }}</span>
              <span>
                {{ invoice.customer.billingAddress.street }}
              </span>
              <span>
                {{ invoice.customer.billingAddress.postalCode }}
                {{ invoice.customer.billingAddress.city }}
              </span>
              <span>
                {{ invoice.customer.billingAddress.country }}
              </span>
              <span v-if="invoice.customer.vatNumber">
                TVA : {{ invoice.customer.vatNumber }}
              </span>
            </address>
          </section>

          <section class="drawer-section">
            <h3>Lignes de facturation</h3>

            <div class="lines-wrapper">
              <table class="invoice-lines">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qté</th>
                    <th>Prix HT</th>
                    <th>TVA</th>
                    <th>Total TTC</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="line in invoice.lines"
                    :key="line.id"
                  >
                    <td data-label="Description">{{ line.description }}</td>
                    <td data-label="Quantité">{{ line.quantity }}</td>
                    <td data-label="Prix HT">
                      {{
                        formatCurrency(
                          line.unitPriceCents,
                        )
                      }}
                    </td>
                    <td data-label="TVA">{{ line.vatRate }} %</td>
                    <td data-label="Total TTC">
                      {{
                        formatCurrency(
                          lineTotalCents(
                            line.quantity,
                            line.unitPriceCents,
                            line.vatRate,
                          ),
                          
                        )
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="drawer-section amounts-section">
            <dl>
              <div>
                <dt>Total HT</dt>
                <dd>
                  {{
                    formatCurrency(
                      invoice.subtotalCents,
                      
                    )
                  }}
                </dd>
              </div>

              <div>
                <dt>TVA</dt>
                <dd>
                  {{
                    formatCurrency(
                      invoice.vatAmountCents,
                      
                    )
                  }}
                </dd>
              </div>

              <div class="amount-total">
                <dt>Total TTC</dt>
                <dd>
                  {{
                    formatCurrency(
                      invoice.totalCents,
                      
                    )
                  }}
                </dd>
              </div>

              <div>
                <dt>Déjà réglé</dt>
                <dd>
                  {{
                    formatCurrency(
                      invoice.amountPaidCents,
                      
                    )
                  }}
                </dd>
              </div>

              <div class="amount-remaining">
                <dt>Reste à payer</dt>
                <dd>
                  {{
                    formatCurrency(
                      invoice.remainingAmountCents,
                      
                    )
                  }}
                </dd>
              </div>
            </dl>
          </section>

          <section
            v-if="invoice.paymentMethod"
            class="drawer-section"
          >
            <h3>Paiement</h3>

            <p>
              {{
                paymentMethodLabels[
                  invoice.paymentMethod
                ]
              }}
              <template v-if="invoice.paymentReference">
                — {{ invoice.paymentReference }}
              </template>
            </p>

            <p v-if="invoice.paidAt">
              Réglée le {{ formatDate(invoice.paidAt) }}
            </p>
          </section>

          <section
            v-if="invoice.creditNote"
            class="drawer-section credit-note"
          >
            <h3>Avoir associé</h3>
            <p>
              Numéro : {{ invoice.creditNote.number }}
            </p>
            <p>
              Émis le :
              {{ formatDate(invoice.creditNote.issuedAt) }}
            </p>
            <p>
              Motif : {{ invoice.creditNote.reason }}
            </p>
          </section>

          <section
            v-if="invoice.notes"
            class="drawer-section"
          >
            <h3>Notes</h3>
            <p>{{ invoice.notes }}</p>
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-layer {
  position: fixed;
  z-index: 1000;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  border: 0;
  background: rgb(15 23 42 / 48%);
  cursor: default;
}

.drawer-header > div,
.drawer-content,
.drawer-summary,
.drawer-section {
  min-width: 0;
}

.drawer-header h2,
.drawer-section p,
address span {
  overflow-wrap: anywhere;
}

.invoice-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(760px, 100vw);
  max-width: 100vw;
  height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #ffffff;
  box-shadow: -12px 0 32px rgb(15 23 42 / 18%);
}

.drawer-header {
  position: sticky;
  z-index: 1;
  top: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.drawer-header h2 {
  margin: 0.25rem 0 0;
}

.drawer-eyebrow {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.drawer-close {
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 0.5rem;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
}

.drawer-content {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}

.drawer-state {
  display: grid;
  min-height: 16rem;
  place-content: center;
  padding: 2rem;
  text-align: center;
}

.drawer-error {
  gap: 1rem;
  color: #b91c1c;
}

.drawer-summary,
.drawer-section {
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.drawer-section h3 {
  margin-top: 0;
}

.drawer-success {
  margin: 0;
  padding: 0.875rem 1rem;
  border: 1px solid #86efac;
  border-radius: 0.75rem;
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.25rem 0 0;
}

.summary-grid div,
.amounts-section dl div {
  display: grid;
  gap: 0.25rem;
}

dt {
  color: #64748b;
  font-size: 0.875rem;
}

dd {
  margin: 0;
  font-weight: 600;
}

address {
  display: grid;
  gap: 0.25rem;
  font-style: normal;
}

.lines-wrapper {
  overflow-x: auto;
}

.invoice-lines {
  width: 100%;
  border-collapse: collapse;
}

.invoice-lines th,
.invoice-lines td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

.invoice-lines th:first-child,
.invoice-lines td:first-child {
  white-space: normal;
}

.amounts-section dl {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.amounts-section dl div {
  grid-template-columns: 1fr auto;
}

.amount-total,
.amount-remaining {
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.amount-total dd,
.amount-remaining dd {
  font-size: 1.125rem;
}

.credit-note {
  border-color: #c4b5fd;
  background: #f5f3ff;
}

.secondary-button {
  padding: 0.625rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #ffffff;
  cursor: pointer;
}

@media (max-width: 600px) {
  .drawer-backdrop {
    display: none;
  }

  .invoice-drawer {
    inset: 0;
    width: 100vw;
    max-width: none;
    height: 100dvh;
    box-shadow: none;
  }

  .drawer-header {
    padding: 1rem;
  }

  .drawer-content {
    gap: 0.875rem;
    padding: 1rem;
  }

  .drawer-summary,
  .drawer-section {
    padding: 1rem;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .lines-wrapper {
    overflow: visible;
  }

  .invoice-lines {
    display: block;
    width: 100%;
  }

  .invoice-lines thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .invoice-lines tbody {
    display: grid;
    gap: 0.75rem;
  }

  .invoice-lines tr {
    display: grid;
    gap: 0.5rem;
    padding: 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.625rem;
  }

  .invoice-lines td {
    display: grid;
    grid-template-columns:
      minmax(6rem, 0.75fr)
      minmax(0, 1fr);
    gap: 0.75rem;
    padding: 0;
    border: 0;
    white-space: normal;
  }

  .invoice-lines td::before {
    content: attr(data-label);
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .amounts-section dl div {
    gap: 1rem;
  }
}
</style>