<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAlert, DsfrCallout } from '@gouvminint/vue-dsfr'
import { usePage } from '@inertiajs/vue3'
import { useDynamicEligibility } from '~/composables/use_dynamic_eligibility'
import { useMatomo } from '~/composables/use_matomo'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'show'>>()

// Track view in Matomo
useMatomo().trackEvent('Simulateur', 'IntermediaryResults', simulateur.slug)

const {
  aidesToEvaluate,
  calculatedResults,
  hasEligibleAides,
  hasPotentialAides,
  hasIneligibleAides,
} = useDynamicEligibility(simulateur.slug)
</script>

<template>
  <div>
    <!-- Eligible aides -->
    <DsfrCallout
      v-if="hasEligibleAides"
      class="fr-p-3w fr-callout--green-emeraude"
    >
      <h3 class="fr-text--md">
        Selon les informations fournies, vous semblez éligible aux aides suivantes :
      </h3>
      <ul>
        <li
          v-for="aide in calculatedResults.eligibleDispositifs"
          :key="aide.id"
        >
          <p class="fr-text--md">
            {{ aide.title }}
          </p>
        </li>
      </ul>
    </DsfrCallout>

    <!-- Potential aides -->
    <DsfrCallout
      v-if="hasPotentialAides"
      class="fr-p-3w fr-callout--blue-cumulus"
    >
      <h3 class="fr-text--md">
        Ces aides nécessitent plus d'informations pour déterminer votre éligibilité :
      </h3>
      <ul>
        <li
          v-for="aide in calculatedResults.potentialDispositifs"
          :key="aide.id"
        >
          <p class="fr-text--md">
            {{ aide.title }}
          </p>
        </li>
      </ul>
    </DsfrCallout>

    <!-- Ineligible aides -->
    <DsfrCallout
      v-if="hasIneligibleAides"
      class="fr-p-3w fr-callout--pink-tuile"
    >
      <h3 class="fr-text--md">
        Selon les informations fournies, vous ne remplissez pas les critères d'éligibilité des dispositifs suivants :
      </h3>
      <ul>
        <li
          v-for="aide in calculatedResults.ineligibleDispositifs"
          :key="aide.id"
        >
          <p class="fr-text--md">
            {{ aide.title }}<span v-if="aide.reason"> : {{ aide.reason }}</span>
          </p>
        </li>
      </ul>
    </DsfrCallout>

    <!-- No aides message -->
    <DsfrAlert
      v-if="!hasEligibleAides && !hasPotentialAides && !hasIneligibleAides && aidesToEvaluate.length > 0"
      title="Calculs en cours ou informations insuffisantes"
      type="info"
      description="Nous analysons votre situation. Continuez la simulation pour affiner les résultats ou vérifiez les informations fournies."
    />
    <DsfrAlert
      v-if="aidesToEvaluate.length === 0"
      title="Aucune aide à évaluer"
      type="info"
      description="Ce questionnaire n'a pas d'aides configurées pour une évaluation intermédiaire à cette étape."
    />
  </div>
</template>
