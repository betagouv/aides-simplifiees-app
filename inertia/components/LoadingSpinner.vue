<script setup lang="ts">
import { VIcon } from '@gouvminint/vue-dsfr'

withDefaults(defineProps<{
  text?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  text: 'Chargement...',
  size: 'md',
})
</script>

<template>
  <div
    class="status-panel"
    aria-busy="true"
    aria-live="polite"
  >
    <p
      class="loading-indicator"
      :class="[
        { 'fr-text--xl': size === 'lg' },
        { 'fr-text--md': size === 'md' },
        { 'fr-text--sm': size === 'sm' },
      ]"
    >
      <VIcon
        class="fr-icon"
        name="ri:refresh-line"
        ssr
      />{{ text }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.status-panel {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loading-indicator {
  color: var(--text-mention-grey);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
}

.loading-indicator:deep(.fr-icon) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
