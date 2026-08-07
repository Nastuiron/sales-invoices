<script setup lang="ts">
import {
  ref,
  watch,
} from 'vue'

import type {
  InvoiceDetails,
  PaymentMethod,
  UpdateInvoiceStatusInput,
} from '../../types/invoice'

const props = defineProps<{
  invoice: InvoiceDetails
  isUpdating: boolean
  errorMessage: string | null
}>()

const emit = defineEmits<{
  submit: [input: UpdateInvoiceStatusInput]
  clearError: []
}>()

type FormMode =
  | 'payment'
  | 'credit'
  | null

const formMode = ref<FormMode>(null)
const paymentAmount = ref('')
const paymentMethod =
  ref<PaymentMethod>('bank_transfer')
const paymentReference = ref('')
const creditReason = ref('')
const validationMessage = ref<string | null>(null)

const paymentMethodLabels: Record<
  PaymentMethod,
  string
> = {
  bank_transfer: 'Virement bancaire',
  card: 'Carte bancaire',
  direct_debit: 'Prélèvement',
  cheque: 'Chèque',
}

watch(
  () => props.invoice.status,
  () => {
    closeForm()
  },
)

function submitImmediateStatus(
  status: 'issued' | 'sent',
): void {
  const message =
    status === 'issued'
      ? 'Confirmer l’émission de cette facture ?'
      : 'Confirmer l’envoi de cette facture ?'

  if (!window.confirm(message)) {
    return
  }

  emit('clearError')
  emit('submit', { status })
}

function openPaymentForm(): void {
  emit('clearError')
  validationMessage.value = null
  formMode.value = 'payment'

  paymentAmount.value = (
    props.invoice.remainingAmountCents / 100
  )
    .toFixed(2)
    .replace('.', ',')
}

function openCreditForm(): void {
  emit('clearError')
  validationMessage.value = null
  creditReason.value = ''
  formMode.value = 'credit'
}

function closeForm(): void {
  formMode.value = null
  validationMessage.value = null
}

function convertEurosToCents(
  value: string,
): number | null {
  const normalizedValue = value
    .trim()
    .replace(',', '.')

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    return null
  }

  const amount = Number(normalizedValue)

  if (!Number.isFinite(amount)) {
    return null
  }

  return Math.round(amount * 100)
}

function submitPayment(): void {
  const amountCents =
    convertEurosToCents(paymentAmount.value)

  if (amountCents === null || amountCents <= 0) {
    validationMessage.value =
      'Saisissez un montant valide.'
    return
  }

  if (
    amountCents
    !== props.invoice.remainingAmountCents
  ) {
    validationMessage.value =
      'Le montant doit correspondre au reste à payer.'
    return
  }

  validationMessage.value = null
  emit('clearError')

  const reference =
    paymentReference.value.trim()

  emit('submit', {
    status: 'paid',
    payment: {
      amountCents,
      method: paymentMethod.value,
      ...(reference !== ''
        ? { reference }
        : {}),
    },
  })
}

function submitCredit(): void {
  const reason = creditReason.value.trim()

  if (reason.length < 3) {
    validationMessage.value =
      'Le motif doit contenir au moins 3 caractères.'
    return
  }

  if (
    !window.confirm(
      'Confirmer la création de l’avoir ?',
    )
  ) {
    return
  }

  validationMessage.value = null
  emit('clearError')

  emit('submit', {
    status: 'credited',
    creditNote: {
      reason,
    },
  })
}
</script>

<template>
  <section class="status-actions">
    <h3>Actions</h3>

    <p
      v-if="errorMessage"
      class="status-actions__error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <div
      v-if="formMode === null"
      class="status-actions__buttons"
    >
      <button
        v-if="invoice.status === 'draft'"
        type="button"
        :disabled="isUpdating"
        @click="submitImmediateStatus('issued')"
      >
        Émettre la facture
      </button>

      <template v-if="invoice.status === 'issued'">
        <button
          type="button"
          :disabled="isUpdating"
          @click="submitImmediateStatus('sent')"
        >
          Marquer comme envoyée
        </button>

        <button
          type="button"
          class="danger-button"
          :disabled="isUpdating"
          @click="openCreditForm"
        >
          Créer un avoir
        </button>
      </template>

      <template v-if="invoice.status === 'sent'">
        <button
          type="button"
          :disabled="isUpdating"
          @click="openPaymentForm"
        >
          Enregistrer le paiement
        </button>

        <button
          type="button"
          class="danger-button"
          :disabled="isUpdating"
          @click="openCreditForm"
        >
          Créer un avoir
        </button>
      </template>

      <p
        v-if="
          invoice.status === 'paid'
          || invoice.status === 'credited'
        "
        class="status-actions__terminal"
      >
        Cette facture ne dispose plus d’action
        de changement de statut.
      </p>
    </div>

    <form
      v-else-if="formMode === 'payment'"
      class="status-actions__form"
      @submit.prevent="submitPayment"
    >
      <label>
        Montant réglé

        <input
          v-model="paymentAmount"
          type="text"
          inputmode="decimal"
          :disabled="isUpdating"
          autocomplete="off"
        >
      </label>

      <label>
        Moyen de paiement

        <select
          v-model="paymentMethod"
          :disabled="isUpdating"
        >
          <option
            v-for="(
              label,
              method
            ) in paymentMethodLabels"
            :key="method"
            :value="method"
          >
            {{ label }}
          </option>
        </select>
      </label>

      <label>
        Référence facultative

        <input
          v-model="paymentReference"
          type="text"
          maxlength="100"
          :disabled="isUpdating"
        >
      </label>

      <p
        v-if="validationMessage"
        class="status-actions__error"
        role="alert"
      >
        {{ validationMessage }}
      </p>

      <div class="status-actions__buttons">
        <button
          type="submit"
          :disabled="isUpdating"
        >
          {{
            isUpdating
              ? 'Enregistrement…'
              : 'Confirmer le paiement'
          }}
        </button>

        <button
          type="button"
          class="secondary-button"
          :disabled="isUpdating"
          @click="closeForm"
        >
          Retour
        </button>
      </div>
    </form>

    <form
      v-else
      class="status-actions__form"
      @submit.prevent="submitCredit"
    >
      <label>
        Motif de l’avoir

        <textarea
          v-model="creditReason"
          rows="4"
          maxlength="500"
          :disabled="isUpdating"
        />
      </label>

      <p
        v-if="validationMessage"
        class="status-actions__error"
        role="alert"
      >
        {{ validationMessage }}
      </p>

      <div class="status-actions__buttons">
        <button
          type="submit"
          class="danger-button"
          :disabled="isUpdating"
        >
          {{
            isUpdating
              ? 'Création…'
              : 'Confirmer l’avoir'
          }}
        </button>

        <button
          type="button"
          class="secondary-button"
          :disabled="isUpdating"
          @click="closeForm"
        >
          Retour
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.status-actions {
  padding: 1.25rem;
  border: 1px solid #bfdbfe;
  border-radius: 0.75rem;
  background: #eff6ff;
}

.status-actions h3 {
  margin-top: 0;
}

.status-actions__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.status-actions button {
  padding: 0.65rem 1rem;
  border: 1px solid #1d4ed8;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.status-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-actions .secondary-button {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #334155;
}

.status-actions .danger-button {
  border-color: #b91c1c;
  background: #b91c1c;
  color: #ffffff;
}

.status-actions__form {
  display: grid;
  gap: 1rem;
}

.status-actions__form label {
  display: grid;
  gap: 0.4rem;
  color: #334155;
  font-weight: 600;
}

.status-actions__form input,
.status-actions__form select,
.status-actions__form textarea {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
}

.status-actions__error {
  color: #b91c1c;
}

.status-actions__terminal {
  margin: 0;
  color: #64748b;
}
</style>