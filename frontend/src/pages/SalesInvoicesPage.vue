<script setup lang="ts">
import { ref } from 'vue'

import InvoiceDetailsDrawer from '../components/invoices/InvoiceDetailsDrawer.vue'
import InvoiceFilters from '../components/invoices/InvoiceFilters.vue'
import InvoiceTable from '../components/invoices/InvoiceTable.vue'
import { useInvoiceDetails } from '../composables/useInvoiceDetails'
import { useInvoices } from '../composables/useInvoices'
import type { UpdateInvoiceStatusInput } from '../types/invoice'

const {
  invoices,
  search,
  selectedStatus,
  isLoading,
  loadError,
  total,
  hasActiveFilters,
  loadInvoices,
  clearFilters,
  simulateError,
} = useInvoices()

const {
  invoice: selectedInvoice,
  isLoading: isDetailsLoading,
  errorMessage: detailsErrorMessage,
  isUpdating,
  actionErrorMessage,
  loadInvoice,
  updateInvoiceStatus,
  clearActionError,
  closeInvoice,
} = useInvoiceDetails()

const selectedInvoiceId = ref<string | null>(
  null,
)

const canSimulateError = import.meta.env.DEV

function selectInvoice(
  invoiceId: string,
): void {
  selectedInvoiceId.value = invoiceId
  void loadInvoice(invoiceId)
}

function closeInvoiceDetails(): void {
  selectedInvoiceId.value = null
  closeInvoice()
}

function retryInvoiceDetails(): void {
  if (selectedInvoiceId.value !== null) {
    void loadInvoice(selectedInvoiceId.value)
  }
}

async function handleStatusUpdate(
  input: UpdateInvoiceStatusInput,
): Promise<void> {
  const wasUpdated =
    await updateInvoiceStatus(input)

  if (wasUpdated) {
    await loadInvoices()
  }
}
</script>

<template>
  <main class="sales-invoices">
    <header class="sales-invoices__header">
      <div>
        <p class="sales-invoices__eyebrow">
          Gestion commerciale
        </p>

        <h1>Factures de vente</h1>

        <p class="sales-invoices__description">
          Consultez les factures émises à vos
          clients et suivez leur règlement.
        </p>
      </div>

      <div
        class="sales-invoices__count"
        aria-live="polite"
      >
        <strong>{{ total }}</strong>
        {{ total > 1 ? 'factures' : 'facture' }}
      </div>
    </header>

    <InvoiceFilters
    v-model:search="search"
    v-model:status="selectedStatus"
    :has-active-filters="hasActiveFilters"
    @clear="clearFilters"
    />

    <section
      v-if="canSimulateError"
      class="sales-invoices__development"
      aria-label="Outils de démonstration"
    >
      <span>
        Mode démonstration
      </span>

      <button
        type="button"
        :disabled="isLoading"
        @click="simulateError"
      >
        Simuler une erreur API
      </button>
    </section>

    <div
      v-if="isLoading && invoices.length === 0"
      class="sales-invoices__state"
      role="status"
      aria-live="polite"
    >
      <span
        class="sales-invoices__spinner"
        aria-hidden="true"
      />

      <strong>
        Chargement des factures…
      </strong>

      <span>
        Les données sont récupérées depuis l’API.
      </span>
    </div>

    <div
      v-else-if="loadError !== null"
      class="sales-invoices__state sales-invoices__state--error"
      role="alert"
    >
      <strong>
        Impossible de charger les factures
      </strong>

      <span>{{ loadError.message }}</span>

      <button
        type="button"
        @click="() => loadInvoices()"
      >
        Réessayer
      </button>
    </div>

    <div
      v-else-if="invoices.length === 0"
      class="sales-invoices__state"
    >
      <strong>
        {{
          hasActiveFilters
            ? 'Aucune facture trouvée'
            : 'Aucune facture disponible'
        }}
      </strong>

      <span v-if="hasActiveFilters">
        Modifiez votre recherche ou vos filtres.
      </span>

      <span v-else>
        Les futures factures apparaîtront ici.
      </span>

      <button
        v-if="hasActiveFilters"
        type="button"
        @click="clearFilters"
      >
        Réinitialiser les filtres
      </button>
    </div>

    <InvoiceTable
      v-else
      :invoices="invoices"
      @select="selectInvoice"
    />

    <InvoiceDetailsDrawer
        :is-open="selectedInvoiceId !== null"
        :invoice="selectedInvoice"
        :is-loading="isDetailsLoading"
        :error-message="detailsErrorMessage"
        :is-updating="isUpdating"
        :action-error-message="actionErrorMessage"
        @close="closeInvoiceDetails"
        @retry="retryInvoiceDetails"
        @update-status="handleStatusUpdate"
        @clear-action-error="clearActionError"
    />
  </main>
</template>

<style scoped>
.sales-invoices {
  display: grid;
  gap: 1.5rem;
  width: min(100% - 2rem, 90rem);
  margin: 0 auto;
  padding: 3rem 0;
}

.sales-invoices__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}

.sales-invoices__eyebrow {
  margin: 0 0 0.5rem;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
}

.sales-invoices__description {
  max-width: 42rem;
  margin: 0.75rem 0 0;
  color: #64748b;
  line-height: 1.6;
}

.sales-invoices__count {
  flex: 0 0 auto;
  padding: 0.75rem 1rem;
  border: 1px solid #dbeafe;
  border-radius: 0.75rem;
  background: #eff6ff;
  color: #1e40af;
}

.sales-invoices__count strong {
  margin-right: 0.25rem;
  font-size: 1.25rem;
}

.sales-invoices__development {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 0.75rem;
  color: #64748b;
  font-size: 0.875rem;
}

.sales-invoices__development button,
.sales-invoices__state button {
  padding: 0.6rem 0.9rem;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #1d4ed8;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.sales-invoices__development button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.sales-invoices__state {
  display: grid;
  justify-items: center;
  gap: 0.65rem;
  min-height: 16rem;
  padding: 3rem 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  background: #ffffff;
  color: #64748b;
  text-align: center;
}

.sales-invoices__state strong {
  color: #0f172a;
  font-size: 1.125rem;
}

.sales-invoices__state--error {
  border-color: #fecaca;
  background: #fffafa;
}

.sales-invoices__state--error strong {
  color: #b91c1c;
}

.sales-invoices__spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .sales-invoices {
    padding: 1.5rem 0;
  }

  .sales-invoices__header {
    align-items: start;
    flex-direction: column;
  }

  .sales-invoices__development {
    align-items: start;
    flex-direction: column;
  }
}
</style>