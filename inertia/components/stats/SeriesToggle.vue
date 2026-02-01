<script setup lang="ts">
/**
 * SeriesToggle Component
 *
 * Provides UI for toggling visibility of chart series.
 * Groups series by data source for better organization.
 * Uses DsfrCheckboxSet for DSFR-compliant checkboxes.
 */
import type { DsfrCheckboxSetProps } from '@gouvminint/vue-dsfr'
import type { SeriesConfig } from '~/composables/use_statistics_data'
import { DsfrCheckboxSet } from '@gouvminint/vue-dsfr'
import { computed } from 'vue'

interface Props {
  /** Available series configurations */
  series: SeriesConfig[]
  /** Set of visible series IDs */
  visibleSeries: Set<string>
}

interface Emits {
  /** Emitted when a series visibility is toggled */
  (e: 'toggle', seriesId: string): void
  /** Emitted to show all series */
  (e: 'showAll'): void
  /** Emitted to hide all series */
  (e: 'hideAll'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * Source display labels
 */
const sourceLabels: Record<string, string> = {
  form_submissions: 'Base de donnees',
  matomo: 'Matomo Analytics',
}

/**
 * Group series by source for organized display
 */
const groupedSeries = computed(() => {
  const groups: Record<string, SeriesConfig[]> = {}

  for (const s of props.series) {
    if (!groups[s.source]) {
      groups[s.source] = []
    }
    groups[s.source].push(s)
  }

  return groups
})

/**
 * Convert series to DsfrCheckboxSet options format per source
 */
function getOptionsForSource(items: SeriesConfig[]): DsfrCheckboxSetProps['options'] {
  return items.map(item => ({
    id: `series-${item.id}`,
    name: `series-${item.id}`,
    value: item.id,
    label: item.label,
  }))
}

/**
 * Get selected values array for a source group
 */
function getSelectedForSource(items: SeriesConfig[]): string[] {
  return items.filter(item => props.visibleSeries.has(item.id)).map(item => item.id)
}

/**
 * Handle checkbox set update - compute diff and emit toggle events
 */
function handleCheckboxSetUpdate(source: string, newSelection: string[]) {
  const items = groupedSeries.value[source] || []
  const currentSelection = getSelectedForSource(items)

  // Find added items
  const added = newSelection.filter(id => !currentSelection.includes(id))
  // Find removed items
  const removed = currentSelection.filter(id => !newSelection.includes(id))

  // Emit toggle for each changed item
  for (const id of [...added, ...removed]) {
    emit('toggle', id)
  }
}
</script>

<template>
  <div class="series-toggle">
    <h3 class="fr-h6">
      Courbes affichees
    </h3>

    <div class="series-toggle__groups">
      <div
        v-for="(items, source) in groupedSeries"
        :key="source"
        class="series-toggle__group"
      >
        <DsfrCheckboxSet
          :legend="sourceLabels[source] || String(source)"
          :options="getOptionsForSource(items)"
          :model-value="getSelectedForSource(items)"
          small
          @update:model-value="handleCheckboxSetUpdate(String(source), $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.series-toggle {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
  }

  &__groups {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  &__group {
    min-width: 150px;

    :deep(.fr-fieldset__legend) {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-mention-grey);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      padding-bottom: 0.5rem;
    }

    :deep(.fr-fieldset__element) {
      margin-bottom: 0.25rem;
    }
  }
}
</style>
