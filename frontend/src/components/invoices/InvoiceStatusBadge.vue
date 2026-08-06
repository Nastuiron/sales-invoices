<script setup lang="ts">
import { computed } from 'vue'

import type {
  InvoiceStatus,
} from '../../types/invoice'

interface Props {
  status: InvoiceStatus
  isOverdue?: boolean
}

const props = withDefaults(
  defineProps<Props>(),
  {
    isOverdue: false,
  },
)

const statusConfiguration = {
  draft: {
    label: 'Brouillon',
    symbol: '○',
    tone: 'neutral',
  },
  issued: {
    label: 'Émise',
    symbol: '◇',
    tone: 'info',
  },
  sent: {
    label: 'Envoyée',
    symbol: '→',
    tone: 'warning',
  },
  paid: {
    label: 'Réglée',
    symbol: '✓',
    tone: 'success',
  },
  credited: {
    label: 'Avoir émis',
    symbol: '↩',
    tone: 'muted',
  },
} as const

const displayedStatus = computed(() => {
  if (props.isOverdue) {
    return {
      label: 'Envoyée — En retard',
      symbol: '!',
      tone: 'danger',
    } as const
  }

  return statusConfiguration[props.status]
})
</script>

<template>
  <span
    class="status-badge"
    :data-tone="displayedStatus.tone"
  >
    <span
      class="status-badge__symbol"
      aria-hidden="true"
    >
      {{ displayedStatus.symbol }}
    </span>

    {{ displayedStatus.label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: fit-content;
  padding: 0.35rem 0.65rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
}

.status-badge__symbol {
  font-weight: 800;
}

.status-badge[data-tone='neutral'] {
  color: #475569;
  background: #f8fafc;
}

.status-badge[data-tone='info'] {
  color: #1d4ed8;
  background: #eff6ff;
}

.status-badge[data-tone='warning'] {
  color: #9a3412;
  background: #fff7ed;
}

.status-badge[data-tone='success'] {
  color: #166534;
  background: #f0fdf4;
}

.status-badge[data-tone='muted'] {
  color: #6b21a8;
  background: #faf5ff;
}

.status-badge[data-tone='danger'] {
  color: #b91c1c;
  background: #fef2f2;
}
</style>