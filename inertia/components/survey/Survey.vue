<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAlert, DsfrBadge } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import SurveyChoiceScreen from '~/components/survey/SurveyChoiceScreen.vue'
import SurveyForm from '~/components/survey/SurveyForm.vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import SurveyWelcomeScreen from '~/components/survey/SurveyWelcomeScreen.vue'
import { useFormSubmission } from '~/composables/use_form_submission'
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useSimulation } from '~/composables/use_simulation'
import * as MatomoService from '~/services/matomo_service'
import { useSurveysStore } from '~/stores/surveys'
import { scrollToAnchor } from '~/utils/dom'
import { getParam } from '~/utils/url'

const {
  url,
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'show'>>()

// Form schema loading and state management
const surveysStore = useSurveysStore()
// Get per-simulateur state
const schemaStatus = computed(() => surveysStore.getSchemaStatus(simulateur.slug))
const hasAnswers = computed(() => surveysStore.hasAnswers(simulateur.slug))
const progress = computed(() => surveysStore.getProgress(simulateur.slug))
const showWelcomeScreen = computed(() => surveysStore.getShowWelcomeScreen(simulateur.slug))
const showChoiceScreen = computed(() => surveysStore.getShowChoiceScreen(simulateur.slug))

const { status: submissionStatus, submit: submitForm } = useFormSubmission()
const { status: simulationStatus, runSimulation } = useSimulation()

const forceResume = getParam(url, 'resume') === 'true'

// Fetch the survey schema
surveysStore.loadSchema(simulateur.slug)

// Watch for schema loading completion to initialize survey
watch(schemaStatus, (status) => {
  if (status === 'success') {
    if (forceResume && hasAnswers.value) {
      // Resume the form if the query parameter is present
      resumeForm()
    }
    else {
      initSurvey()
    }
  }
}, { immediate: true })

// Full survey initialization, including Matomo tracking
function initSurvey() {
  // Track form start in Matomo
  MatomoService.trackSurveyStart(simulateur.slug)
  // Show the choice screen if there are answers
  if (hasAnswers.value) {
    surveysStore.setShowChoiceScreen(simulateur.slug, true)
    surveysStore.setShowWelcomeScreen(simulateur.slug, false)
  }
  else {
    // Show the welcome screen if there are no answers
    surveysStore.setShowChoiceScreen(simulateur.slug, false)
    surveysStore.setShowWelcomeScreen(simulateur.slug, true)
  }
}

function resumeForm() {
  submissionStatus.value = 'idle'
  simulationStatus.value = 'idle'
  surveysStore.setShowChoiceScreen(simulateur.slug, false)
  surveysStore.setShowWelcomeScreen(simulateur.slug, false)
  scrollToAnchor('simulateur-title')
}

// Restart the form from the beginning
function restartForm() {
  submissionStatus.value = 'idle'
  simulationStatus.value = 'idle'
  surveysStore.resetSurvey(simulateur.slug)
  surveysStore.setShowChoiceScreen(simulateur.slug, false)
  surveysStore.setShowWelcomeScreen(simulateur.slug, true)
  scrollToAnchor('simulateur-title')
}

/**
 * Submit the form answers and results to the server
 */
async function handleFormComplete(): Promise<void> {
  const schema = surveysStore.getSchema(simulateur.slug)
  if (!schema) {
    console.error(`Schema not found for simulateur: ${simulateur.slug}`)
    return
  }
  const answers = surveysStore.getAnswersForCalculation(simulateur.slug)
  const results = await runSimulation(answers, schema)
  if (!results) {
    console.error(`Simulation failed for simulateur: ${simulateur.slug}`)
    return
  }
  submitForm(simulateur.slug, answers, results)
    .then((response) => {
      if (response.success && response.hash) {
        setTimeout(() => {
          router.visit(`/simulateurs/${simulateur.slug}/resultats/${response.hash}#simulateur-title`, { preserveState: true })
        }, 1000)
      }
      else {
        setTimeout(() => {
          resumeForm()
        }, 1500)
      }
    })
}

onMounted(() => {
  surveysStore.onComplete(simulateur.slug, handleFormComplete)
})
onBeforeUnmount(() => {
  surveysStore.deleteCompleteListeners()
})

const { isIframe } = useIframeDisplay()
</script>

<template>
  <div>
    <!--
    If rendered in an iframe, we need to add an invisible h1 tag to the page for a11y purpose.
    If not in an iframe, an h1 has already been added earlier in the layout (see UserSimulation.vue)
    -->
    <h1
      v-if="isIframe"
      class="fr-sr-only"
    >
      Votre simulation « {{ simulateur.title }} »
    </h1>

    <LoadingSpinner v-if="schemaStatus === 'pending'" />
    <DsfrAlert
      v-else-if="schemaStatus === 'error'"
      aria-live="assertive"
      type="error"
      title="Erreur lors du chargement du formulaire"
    />

    <template v-else-if="schemaStatus === 'success'">
      <!-- Choice screen for resuming or restarting -->
      <template v-if="showChoiceScreen">
        <SurveyChoiceScreen :progress="progress" />
        <SurveyNavigation
          :buttons="[
            {
              'label': 'Recommencer',
              'data-testid': 'survey-restart-button',
              'secondary': true,
              'icon': { name: 'ri:refresh-line', ssr: true },
              'onClick': restartForm,
            },
            {
              'label': 'Reprendre',
              'iconRight': true,
              'data-testid': 'survey-resume-button',
              'icon': { name: 'ri:arrow-right-line', ssr: true },
              'onClick': resumeForm,
            },
          ]"
        />
      </template>

      <!-- Welcome screen for starting the survey -->
      <template v-else-if="showWelcomeScreen">
        <SurveyWelcomeScreen :simulateur="simulateur" />
        <SurveyNavigation
          :buttons="[
            {
              'label': 'Commencer la simulation',
              'data-testid': 'survey-start-button',
              'iconRight': true,
              'icon': { name: 'ri:arrow-right-line', ssr: true },
              'onClick': resumeForm,
            },
          ]"
        />
      </template>

      <!-- Results status panel -->
      <div
        v-else-if="(
          submissionStatus !== 'idle'
          || simulationStatus !== 'idle'
        )"
        class="status-panel"
      >
        <LoadingSpinner
          v-if="(
            submissionStatus === 'pending'
            || simulationStatus === 'pending'
          )"
          text="Estimation en cours..."
          test-id="survey-results-loading"
          size="lg"
        />
        <DsfrBadge
          v-else-if="submissionStatus === 'success' || submissionStatus === 'error'"
          :type="({
            success: 'success',
            error: 'error',
          }[submissionStatus] as 'info' | 'success' | 'error')"
          :data-testid="`survey-results-${submissionStatus}`"
          :label="{
            success: 'Estimation terminée',
            error: 'Erreur lors de l\'estimation',
          }[submissionStatus]"
        />
      </div>

      <!-- Survey form -->
      <SurveyForm v-else />
    </template>
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
  min-height: 10em;
}
</style>
