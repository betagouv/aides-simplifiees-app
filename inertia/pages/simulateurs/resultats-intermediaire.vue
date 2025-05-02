<script lang="ts" setup>
import type SimulateurController from '#controllers/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrButton } from '@gouvminint/vue-dsfr'
import { Head, router, usePage } from '@inertiajs/vue3'
import SectionSeparator from '~/components/layout/SectionSeparator.vue'
import { useMatomo } from '~/composables/use_matomo'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { useSurveysStore } from '~/stores/surveys'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'showResultatsIntermediaire'>>()

const simulateurTitle = simulateur.title || simulateur.slug
const surveysStore = useSurveysStore()

// Track view in Matomo
useMatomo().trackEvent('Simulateur', 'IntermediaryResults', simulateur.slug)

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle, to: `/simulateurs/${simulateur.slug}#simulateur-title` },
  {
    text: 'Résultats intermédiaires',
    to: `/simulateurs/${simulateur.slug}/resultats-intermediaire#simulateur-title`,
  },
])

// Continue to the next step
function continueToNextStep() {
  // Navigate back to the simulateur and continue with the next step
  router.visit(`/simulateurs/${simulateur.slug}?resume=true#simulateur-title`, {
    preserveState: true,
    preserveScroll: true,
  })
}
</script>

<template>
  <Head
    :title="`Résultats intermédiaires de votre simulation '${simulateurTitle}'`"
    :description="`Découvrez les dispositifs auxquels vous pourriez être éligibles selon les informations déjà fournies dans '${simulateurTitle}'.`"
  />
  <article class="intermediary-results">
    <header class="results__header">
      <div>
        <hgroup>
          <h2
            v-if="simulateurTitle"
            class="results__title"
          >
            Résultats intermédiaires de votre simulation
          </h2>
          <p class="fr-text fr-mb-3w">
            Voici une estimation préliminaire des dispositifs auxquels vous pourriez être éligible basée sur les informations déjà fournies.
            Pour améliorer cette estimation, continuez votre simulation en répondant aux questions suivantes.
          </p>
        </hgroup>
      </div>
    </header>
    <SectionSeparator fluid class="fr-mt-6w" />
    <div class="results__content fr-mt-4w">
      <div class="fr-card fr-p-3w">
        <h3>Dispositifs potentiellement disponibles</h3>
        <p>
          En fonction des informations que vous avez déjà fournies, vous pourriez être éligible
          aux dispositifs suivants:
        </p>
        <ul class="fr-mt-2w">
          <li>Crédit d'Impôt Recherche (CIR)</li>
          <li>Crédit d'Impôt Innovation (CII)</li>
          <li>Jeune Entreprise Innovante (JEI)</li>
        </ul>
        <p class="fr-mt-3w">
          Cette liste est basée uniquement sur les informations fournies jusqu'à présent.
          Des critères supplémentaires peuvent s'appliquer.
        </p>

        <div class="fr-mt-4w fr-mb-2w">
          <DsfrButton
            label="Continuer la simulation"
            icon-right
            icon="ri:arrow-right-line"
            @click="continueToNextStep"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.intermediary-results {
  margin-bottom: 2rem;
}
</style>
