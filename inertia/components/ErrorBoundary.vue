<script setup lang="ts">
import { DsfrAlert, DsfrButton } from '@gouvminint/vue-dsfr'
import { onErrorCaptured, ref } from 'vue'
import { captureError } from '~/utils/error_tracker'

interface Props {
  fallbackMessage?: string
  showReload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: 'Une erreur s\'est produite.',
  showReload: true,
})

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  console.error('Component error caught by ErrorBoundary:', err)
  // Send to Sentry (or console in development)
  captureError(err, { component: 'ErrorBoundary', source: 'onErrorCaptured' })
  return false // Prevent propagation
})

function reset() {
  error.value = null
}

function reload() {
  window.location.reload()
}
</script>

<template>
  <div
    v-if="error"
    class="error-boundary"
  >
    <DsfrAlert
      type="error"
      :title="props.fallbackMessage"
    >
      <p v-if="error.message">
        {{ error.message }}
      </p>
      <div class="fr-btns-group fr-btns-group--inline fr-mt-2w">
        <DsfrButton @click="reset">
          Réessayer
        </DsfrButton>
        <DsfrButton
          v-if="props.showReload"
          secondary
          @click="reload"
        >
          Recharger la page
        </DsfrButton>
      </div>
    </DsfrAlert>
  </div>
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  margin: 1rem 0;
}
</style>
