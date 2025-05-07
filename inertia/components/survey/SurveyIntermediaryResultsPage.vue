<script lang="ts" setup>
import type SimulateurController from '#controllers/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import sourceRules from '#publicodes-build/index'
import { DsfrAlert } from '@gouvminint/vue-dsfr'
import { usePage } from '@inertiajs/vue3'
import Engine from 'publicodes'
import { computed, onMounted, ref, watch } from 'vue'
import { useMatomo } from '~/composables/use_matomo'
import { useSurveysStore } from '~/stores/surveys'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'showSimulateur'>>()

// Track view in Matomo
useMatomo().trackEvent('Simulateur', 'IntermediaryResults', simulateur.slug)

// Access the survey store
const surveysStore = useSurveysStore()

// Get answers from the survey
const surveyAnswers = computed(() => surveysStore.getAnswersForCalculation(simulateur.slug))
const currentPage = computed(() => surveysStore.getCurrentPage(simulateur.slug) as SurveyResultsPage)
const schema = computed(() => surveysStore.getSchema(simulateur.slug))
// Get dispositifs from the page configuration
const dispositifsToEvaluate = computed(() => {
  if (currentPage.value?.type === 'intermediary-results' && currentPage.value?.dispositifs) {
    // Look up dispositifs details from the form schema
    const deviceDetails = schema.value?.intermediaryResults?.dispositifs || []

    return currentPage.value.dispositifs.map(deviceId => {
      const deviceDetail = deviceDetails.find(d => d.id === deviceId)
      return deviceDetail || {
        id: deviceId,
        title: deviceId,
        description: `Dispositif ${deviceId}`
      }
    })
  }
  return []
})

// State for calculated results
const calculatedResults = ref<{
  eligibleDispositifs: Array<{ id: string, title: string, description: string, value: any }>
  potentialDispositifs: Array<{ id: string, title: string, description: string, value: any }>
  ineligibleDispositifs: Array<{ id: string, title: string, description: string, value: any, reason?: string }>
}>({
  eligibleDispositifs: [],
  potentialDispositifs: [],
  ineligibleDispositifs: [],
})

const hasEligibleDispositifs = computed(() => calculatedResults.value.eligibleDispositifs.length > 0)
const hasPotentialDispositifs = computed(() => calculatedResults.value.potentialDispositifs.length > 0)
const hasIneligibleDispositifs = computed(() => calculatedResults.value.ineligibleDispositifs.length > 0)

// Map form answers to publicodes variables
function mapFormAnswersToPublicodesVariables() {
  const answers = surveyAnswers.value
  const mappedAnswers: Record<string, any> = {}

  // Map immatriculationFrance
  if (answers['immatriculation-france'] !== undefined) {
    mappedAnswers['immatriculationFrance'] = answers['immatriculation-france'] ? 'oui' : 'non'
  }

  // Map nature activities
  if (answers['nature-activite']) {
    const activities = Array.isArray(answers['nature-activite'])
      ? answers['nature-activite']
      : [answers['nature-activite']]

    mappedAnswers['natureActivite . industrielle'] = activities.includes('industrielle') ? 'oui' : 'non'
    mappedAnswers['natureActivite . commerciale'] = activities.includes('commerciale') ? 'oui' : 'non'
    mappedAnswers['natureActivite . agricole'] = activities.includes('agricole') ? 'oui' : 'non'
    mappedAnswers['natureActivite . artisanale'] = activities.includes('artisanale') ? 'oui' : 'non'
  }

  // Map BIC for artisanal activities
  if (answers['bic'] !== undefined && Array.isArray(answers['nature-activite']) && answers['nature-activite']?.includes('artisanale')) {
    mappedAnswers['bic'] = answers['bic'] ? 'oui' : 'non'
    mappedAnswers['natureActivite . artisanale et bic'] = answers['bic'] ? 'oui' : 'non'
  }

  // Map regime d'imposition
  if (answers['regime-imposition']) {
    mappedAnswers['regimeImposition'] = answers['regime-imposition'] === 'non'
      ? 'autre'
      : answers['regime-imposition']
  }

  // Map exoneration category
  if (answers['categorie-exoneration'] && Array.isArray(answers['categorie-exoneration'])) {
    const exonerations = answers['categorie-exoneration']
    if (exonerations.includes('none')) {
      mappedAnswers['categorieExoneration'] = 'aucune'
    }
    else if (exonerations.includes('jei')) {
      mappedAnswers['categorieExoneration'] = 'jeune entreprise innovante'
    }
    else if (exonerations.includes('zone-specifique')) {
      mappedAnswers['categorieExoneration'] = 'zonage'
    }
    else {
      mappedAnswers['categorieExoneration'] = 'temporaire'
    }
  }

  // Map research activities
  if (answers['nature-activites'] && Array.isArray(answers['nature-activites'])) {
    const activities = answers['nature-activites']
    mappedAnswers['natureActivites . fondamentale'] = activities.includes('fondamentale') ? 'oui' : 'non'
    mappedAnswers['natureActivites . appliquee'] = activities.includes('appliquee') ? 'oui' : 'non'
    mappedAnswers['natureActivites . experimentale'] = activities.includes('experimentale') ? 'oui' : 'non'
  } else if (answers['activites'] && Array.isArray(answers['activites']) && answers['activites'].includes('rd')) {
    // If nature-activites not set but user indicated they do R&D
    mappedAnswers['natureActivites . fondamentale'] = 'non'
    mappedAnswers['natureActivites . appliquee'] = 'non'
    mappedAnswers['natureActivites . experimentale'] = 'non'
  }

  // Map research location
  if (answers['localisation-recherche']) {
    switch (answers['localisation-recherche']) {
      case 'france':
      case 'ue':
        mappedAnswers['localisationRecherche'] = 'ue'
        break
      case 'eee':
        mappedAnswers['localisationRecherche'] = 'eee'
        break
      default:
        mappedAnswers['localisationRecherche'] = 'hors ue et eee'
    }
  }

  // Map convention fiscale
  if (answers['convention-fiscale']) {
    mappedAnswers['conventionFiscale'] = answers['convention-fiscale'] === 'oui' ? 'oui' : 'non'
  }

  console.log('Mapped answers for publicodes:', mappedAnswers)
  return mappedAnswers
}

// Calculate eligibility based on the answers provided so far
function calculateEligibility() {
  try {
    // Initialize publicodes engine
    const engine = new Engine(sourceRules)

    // Map form answers to publicodes variables
    const mappedAnswers = mapFormAnswersToPublicodesVariables()

    // Set situation based on mapped answers
    engine.setSituation(mappedAnswers)

    // Evaluate each device
    const eligibleDispositifs = []
    const potentialDispositifs = []
    const ineligibleDispositifs = []

    for (const device of dispositifsToEvaluate.value) {
      try {
        const result = engine.evaluate(`${device.id}`)

        const isEligible = result.nodeValue === true
        const isIneligible = result.nodeValue === false
        const isPotential = result.nodeValue === null
        const reason = "Raison d'inéligibilité"
        const value = result.nodeValue
        const description = device.description
        const title = device.title || device.id
        const deviceResult = { ...device, value, description, title }
        if (isEligible) {
          eligibleDispositifs.push(deviceResult)
        }
        else if (isIneligible) {
          ineligibleDispositifs.push({ ...deviceResult, reason })
        }
        else if (isPotential) {
          potentialDispositifs.push(deviceResult)
        }

      }
      catch (error) {
        console.warn(`Error evaluating ${device.id}:`, error)
        potentialDispositifs.push({ ...device, value: null })
      }
    }

    calculatedResults.value = {
      eligibleDispositifs,
      potentialDispositifs,
      ineligibleDispositifs,
    }
  }
  catch (error) {
    console.error('Error calculating eligibility:', error)
  }
}

// Recalculate whenever answers or dispositifs change
watch([surveyAnswers, dispositifsToEvaluate], () => {
  calculateEligibility()
})

onMounted(() => {
  calculateEligibility()
})
</script>

<template>
  <div>
    <div
      v-if="hasEligibleDispositifs"
      class="fr-mb-3w"
    >
      <h3 class="fr-h6">Dispositifs pour lesquels vous semblez éligible</h3>
      <p>
        En fonction des informations que vous avez déjà fournies, vous semblez éligible
        aux dispositifs suivants :
      </p>
      <ul>
        <li
          v-for="device in calculatedResults.eligibleDispositifs"
          :key="device.id"
        >
          <strong>{{ device.title }}</strong>
          <p>
            {{ device.description }}
          </p>
        </li>
      </ul>
    </div>

    <!-- Potential dispositifs -->
    <div
      v-if="hasPotentialDispositifs"
      class="fr-mb-3w"
    >
      <h3 class="fr-h6">
        Dispositifs pour lesquels vous pourriez être éligible
      </h3>
      <p>
        Ces dispositifs nécessitent plus d'informations pour déterminer votre éligibilité :
      </p>
      <ul>
        <li
          v-for="device in calculatedResults.potentialDispositifs"
          :key="device.id"
        >
          <strong>{{ device.title }}</strong>
          <p>
            {{ device.description }}
          </p>
        </li>
      </ul>
    </div>

    <!-- Ineligible dispositifs -->
    <div
      v-if="hasIneligibleDispositifs"
      class="fr-mb-3w"
    >
      <h3>Dispositifs pour lesquels vous n'êtes pas éligible</h3>
      <p>
        Selon les informations fournies, vous ne remplissez pas les critères d'éligibilité pour :
      </p>
      <ul>
        <li
          v-for="device in calculatedResults.ineligibleDispositifs"
          :key="device.id"
        >
          <strong>{{ device.title }}</strong>
          <p>
            {{ device.description }}
          </p>
          <p
            v-if="device.reason"
          >
            <small>Raison : {{ device.reason }}</small>
          </p>
        </li>
      </ul>
    </div>

    <!-- No dispositifs message -->
    <DsfrAlert
      v-if="!hasEligibleDispositifs && !hasPotentialDispositifs && !hasIneligibleDispositifs"
      title="Aucun dispositif identifié pour l'instant"
      type="info"
      description="En fonction des informations fournies jusqu'à présent, nous n'avons pas encore pu déterminer votre éligibilité. Continuez la simulation pour obtenir des résultats."
    />
  </div>
</template>
