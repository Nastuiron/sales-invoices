<script setup lang="ts">
import type {
  InvoiceStatus,
} from '../../types/invoice'

interface Props {
  search: string
  status: InvoiceStatus | 'all'
  hasActiveFilters: boolean
  disabled?: boolean
}

withDefaults(
  defineProps<Props>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:search': [value: string]
  'update:status': [
    value: InvoiceStatus | 'all',
  ]
  clear: []
}>()

function handleSearchInput(event: Event): void {
  const input = event.target as HTMLInputElement

  emit('update:search', input.value)
}

function handleStatusChange(event: Event): void {
  const select = event.target as HTMLSelectElement

  emit(
    'update:status',
    select.value as InvoiceStatus | 'all',
  )
}
</script>

<template>
  <section
    class="invoice-filters"
    aria-label="Recherche et filtres"
  >
    <div class="invoice-filters__field">
      <label for="invoice-search">
        Rechercher une facture
      </label>

      <div class="invoice-filters__search">
        <span aria-hidden="true">⌕</span>

        <input
          id="invoice-search"
          type="search"
          :value="search"
          :disabled="disabled"
          autocomplete="off"
          placeholder="Numéro, client ou référence"
          @input="handleSearchInput"
        >
      </div>
    </div>

    <div class="invoice-filters__field">
      <label for="invoice-status">
        Statut
      </label>

      <select
        id="invoice-status"
        :value="status"
        :disabled="disabled"
        @change="handleStatusChange"
      >
        <option value="all">
          Tous les statuts
        </option>
        <option value="draft">
          Brouillon
        </option>
        <option value="issued">
          Émise
        </option>
        <option value="sent">
          Envoyée
        </option>
        <option value="paid">
          Réglée
        </option>
        <option value="credited">
          Avoir émis
        </option>
      </select>
    </div>

    <button
      v-if="hasActiveFilters"
      class="invoice-filters__clear"
      type="button"
      :disabled="disabled"
      @click="emit('clear')"
    >
      Réinitialiser
    </button>
  </section>
</template>

<style scoped>
.invoice-filters {
  display: grid;
  grid-template-columns:
    minmax(16rem, 1fr)
    minmax(12rem, 0.35fr)
    auto;
  align-items: end;
  gap: 1rem;
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  box-shadow:
    0 1px 2px rgb(15 23 42 / 4%);
}

.invoice-filters__field {
  display: grid;
  gap: 0.5rem;
}

.invoice-filters label {
  color: #334155;
  font-size: 0.875rem;
  font-weight: 650;
}

.invoice-filters__search {
  position: relative;
}

.invoice-filters__search span {
  position: absolute;
  top: 50%;
  left: 0.85rem;
  color: #64748b;
  transform: translateY(-50%);
  pointer-events: none;
}

.invoice-filters input,
.invoice-filters select {
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.625rem;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
}

.invoice-filters input {
  padding: 0.7rem 0.85rem 0.7rem 2.5rem;
}

.invoice-filters select {
  padding: 0.7rem 2.5rem 0.7rem 0.85rem;
}

.invoice-filters input:focus,
.invoice-filters select:focus {
  border-color: #2563eb;
  outline: 3px solid rgb(37 99 235 / 15%);
}

.invoice-filters input:disabled,
.invoice-filters select:disabled,
.invoice-filters button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.invoice-filters__clear {
  min-height: 2.75rem;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 0.625rem;
  background: transparent;
  color: #1d4ed8;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.invoice-filters__clear:hover {
  background: #eff6ff;
}

@media (max-width: 760px) {
  .invoice-filters {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .invoice-filters__clear {
    justify-self: start;
  }
}
</style>