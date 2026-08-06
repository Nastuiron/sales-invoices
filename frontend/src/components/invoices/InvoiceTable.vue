<script setup lang="ts">
import {
  formatCurrency,
  formatDate,
} from '../../utils/formatters'
import type {
  InvoiceSummary,
} from '../../types/invoice'
import InvoiceStatusBadge from './InvoiceStatusBadge.vue'

interface Props {
  invoices: InvoiceSummary[]
}

defineProps<Props>()

const emit = defineEmits<{
  select: [invoiceId: string]
}>()
</script>

<template>
  <div class="invoice-table">
    <table>
      <caption class="sr-only">
        Liste des factures de vente
      </caption>

      <thead>
        <tr>
          <th scope="col">
            Facture
          </th>
          <th scope="col">
            Client
          </th>
          <th scope="col">
            Émission
          </th>
          <th scope="col">
            Échéance
          </th>
          <th
            scope="col"
            class="invoice-table__amount"
          >
            Montant TTC
          </th>
          <th
            scope="col"
            class="invoice-table__amount"
          >
            Reste à payer
          </th>
          <th scope="col">
            Statut
          </th>
          <th scope="col">
            <span class="sr-only">
              Actions
            </span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="invoice in invoices"
          :key="invoice.id"
        >
          <td>
            <span
              v-if="invoice.invoiceNumber"
              class="invoice-table__number"
            >
              {{ invoice.invoiceNumber }}
            </span>

            <span
              v-else
              class="invoice-table__draft"
            >
              Sans numéro
            </span>
          </td>

          <td>
            <span class="invoice-table__customer">
              {{ invoice.customer.name }}
            </span>
          </td>

          <td>
            {{ formatDate(invoice.issueDate) }}
          </td>

          <td
            :class="{
              'invoice-table__overdue':
                invoice.isOverdue,
            }"
          >
            {{ formatDate(invoice.dueDate) }}
          </td>

          <td class="invoice-table__amount">
            {{ formatCurrency(invoice.totalCents) }}
          </td>

          <td class="invoice-table__amount">
            {{
              formatCurrency(
                invoice.remainingAmountCents,
              )
            }}
          </td>

          <td>
            <InvoiceStatusBadge
              :status="invoice.status"
              :is-overdue="invoice.isOverdue"
            />
          </td>

          <td class="invoice-table__action">
            <button
              type="button"
              :aria-label="`Consulter la facture ${
                invoice.invoiceNumber ??
                'sans numéro'
              } de ${invoice.customer.name}`"
              @click="emit('select', invoice.id)"
            >
              Consulter
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.invoice-table {
  overflow-x: auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  box-shadow:
    0 1px 2px rgb(15 23 42 / 4%);
}

table {
  width: 100%;
  min-width: 68rem;
  border-collapse: collapse;
}

th,
td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

td {
  color: #334155;
  font-size: 0.875rem;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover {
  background: #f8fafc;
}

.invoice-table__number,
.invoice-table__customer {
  color: #0f172a;
  font-weight: 650;
}

.invoice-table__draft {
  color: #64748b;
  font-style: italic;
}

.invoice-table__amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.invoice-table__overdue {
  color: #b91c1c;
  font-weight: 700;
}

.invoice-table__action {
  text-align: right;
}

.invoice-table__action button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  background: #eff6ff;
  color: #1d4ed8;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.invoice-table__action button:hover {
  border-color: #2563eb;
  background: #dbeafe;
}

.invoice-table__action button:focus-visible {
  outline: 3px solid rgb(37 99 235 / 25%);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>