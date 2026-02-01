<script lang="ts" setup>
import { DsfrButton, DsfrSegmentedSet } from '@gouvminint/vue-dsfr'

type Granularity = 'day' | 'week' | 'month' | 'year'

defineProps<{
  granularity: Granularity
  granularityOptions: Array<{ value: string, label: string }>
  displayDateRange: string | null
  isLoading: boolean
  customStartDate: string | null
  customEndDate: string | null
}>()

const emit = defineEmits<{
  updateGranularity: [value: Granularity]
  navigateTime: [direction: 'prev' | 'next']
  resetDateRange: []
}>()
</script>

<template>
  <h2 class="fr-h6 fr-mb-3w">
    Options d'affichage
  </h2>

  <!-- Granularity selector -->
  <div class="fr-mb-2w">
    <DsfrSegmentedSet
      small
      :model-value="granularity"
      legend="Periode"
      name="granularity"
      :options="granularityOptions"
      @update:model-value="emit('updateGranularity', $event as Granularity)"
    />
  </div>

  <!-- Date navigation -->
  <div class="fr-mb-2w">
    <div class="date-nav">
      <DsfrButton
        :disabled="isLoading"
        :icon="{ name: 'ri:arrow-left-s-line', ssr: true }"
        icon-only
        secondary
        size="sm"
        title="Periode precedente"
        @click="emit('navigateTime', 'prev')"
      />
      <span
        v-if="displayDateRange"
        class="date-range"
      >
        {{ displayDateRange }}
      </span>
      <DsfrButton
        :disabled="isLoading || (!customStartDate && !customEndDate)"
        :icon="{ name: 'ri:arrow-right-s-line', ssr: true }"
        icon-only
        secondary
        size="sm"
        title="Periode suivante"
        @click="emit('navigateTime', 'next')"
      />
    </div>
    <DsfrButton
      v-if="customStartDate || customEndDate"
      :disabled="isLoading"
      class="fr-mt-1w"
      label="Revenir au present"
      secondary
      size="sm"
      @click="emit('resetDateRange')"
    />
  </div>
</template>

<style scoped>
.date-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.date-range {
  font-size: 0.875rem;
  color: var(--text-mention-grey);
  min-width: 180px;
  text-align: center;
}
</style>
