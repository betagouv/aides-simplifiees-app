<script lang="ts" setup>
import { DsfrButton } from '@gouvminint/vue-dsfr'
import axios from 'axios'
import { ref } from 'vue'

const props = defineProps<{
  aideSlug: string
  submissionHash: string
  dsEnabled: boolean
  dsDemarcheId?: string | null
}>()

const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMessage = ref<string>('')

async function handlePrefillDossier() {
  if (!props.dsEnabled || !props.dsDemarcheId) {
    return
  }

  status.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await axios.post('/api/demarches-simplifiees/prefill', {
      aideSlug: props.aideSlug,
      submissionHash: props.submissionHash,
    })

    if (response.data.success && response.data.dossierUrl) {
      status.value = 'success'
      // Open the prefilled dossier in a new tab
      window.open(response.data.dossierUrl, '_blank')

      // Reset status after a delay
      setTimeout(() => {
        status.value = 'idle'
      }, 3000)
    }
    else {
      throw new Error('Failed to create prefilled dossier')
    }
  }
  catch (error: any) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Une erreur est survenue lors de la création du dossier prérempli'
    console.error('Error creating prefilled DS dossier:', error)

    // Reset status after a delay
    setTimeout(() => {
      status.value = 'idle'
      errorMessage.value = ''
    }, 5000)
  }
}
</script>

<template>
  <div
    v-if="dsEnabled && dsDemarcheId"
    class="ds-button-container"
  >
    <DsfrButton
      :label="status === 'loading' ? 'Création en cours...' : 'Réaliser ma démarche avec Démarches Simplifiées'"
      :disabled="status === 'loading'"
      :icon="{ name: 'ri:external-link-line', ssr: true }"
      icon-right
      @click="handlePrefillDossier"
    />

    <p
      v-if="status === 'success'"
      class="fr-text--sm fr-text--bold fr-mt-2w"
      style="color: var(--success-425-625);"
    >
      ✓ Dossier créé avec succès ! Redirection en cours...
    </p>

    <p
      v-if="status === 'error'"
      class="fr-text--sm fr-text--bold fr-mt-2w"
      style="color: var(--error-425-625);"
    >
      ✗ {{ errorMessage }}
    </p>

    <p class="fr-text--xs fr-mt-2w">
      Cette action va créer un dossier prérempli sur demarches-simplifiees.fr avec les réponses que vous avez fournies dans le simulateur.
    </p>
  </div>
</template>

<style scoped lang="scss">
.ds-button-container {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: var(--background-alt-blue-france);
  border-radius: 0.5rem;
}
</style>
