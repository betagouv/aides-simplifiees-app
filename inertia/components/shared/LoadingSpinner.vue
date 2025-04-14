<script setup lang="ts">
withDefaults(defineProps<{
  text?: string
}>(), {
  text: 'Chargement...'
})
</script>

<template>
  <div class="state-panel">
    <p class="loading-indicator fr-text--xl fr-mt-3w">
      <span
        class="fr-icon-refresh-line fr-icon fr-icon--md fr-mr-1v"
        aria-hidden="true"
      />{{ text }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.state-panel {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 10em;
}

.loading-indicator {
  color: var(--text-mention-grey);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
}

.loading-indicator .fr-icon {
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
