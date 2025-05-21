<script lang="ts" setup>
import type SimulateurController from '#controllers/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAlert, DsfrBadge } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import SurveyChoiceScreen from '~/components/survey/SurveyChoiceScreen.vue'
import SurveyForm from '~/components/survey/SurveyForm.vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import SurveyWelcomeScreen from '~/components/survey/SurveyWelcomeScreen.vue'
import { useEligibilityService } from '~/composables/use_eligibility_service'
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useMatomo } from '~/composables/use_matomo'
import { useSubmissionStore } from '~/stores/submissions'
import { useSurveysStore } from '~/stores/surveys'
import { scrollToAnchor } from '~/utils/dom'
import { getParam } from '~/utils/url'

const {
  url,
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'showSimulateur'>>()

// Form schema loading and state management
const surveysStore = useSurveysStore()
// Get per-simulateur state
const schemaStatus = computed(() => surveysStore.getSchemaStatus(simulateur.slug))
const hasAnswers = computed(() => surveysStore.hasAnswers(simulateur.slug))
const progress = computed(() => surveysStore.getProgress(simulateur.slug))
const showWelcomeScreen = computed(() => surveysStore.getShowWelcomeScreen(simulateur.slug))
const showChoiceScreen = computed(() => surveysStore.getShowChoiceScreen(simulateur.slug))
// Form submission
const submissionStore = useSubmissionStore()
const resultsFetchStatus = computed(() => submissionStore.getSubmissionStatus(simulateur.slug))

const forceResume = getParam(url, 'resume') === 'true'

// Fetch the survey schema
surveysStore.loadSchema(simulateur.slug)

if (forceResume && hasAnswers.value) {
  // Resume the form if the query parameter is present
  resumeForm()
}
else {
  initSurvey()
}

// Full survey initialization, including Matomo tracking
function initSurvey() {
  // Track form start in Matomo
  useMatomo().trackSurveyStart(simulateur.slug)
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
  submissionStore.setSubmissionStatus(simulateur.slug, 'idle')
  surveysStore.setShowChoiceScreen(simulateur.slug, false)
  surveysStore.setShowWelcomeScreen(simulateur.slug, false)
  scrollToAnchor('simulateur-title')
}

// Restart the form from the beginning
function restartForm() {
  submissionStore.setSubmissionStatus(simulateur.slug, 'idle')
  surveysStore.resetSurvey(simulateur.slug)
  surveysStore.setShowChoiceScreen(simulateur.slug, false)
  surveysStore.setShowWelcomeScreen(simulateur.slug, true)
  scrollToAnchor('simulateur-title')
}

// Gérer la soumission du formulaire
function handleFormComplete(): void {
  const simulateurVisibleAnswers = surveysStore.getAnswersForCalculation(simulateur.slug)


  const schema = surveysStore.getSchema(simulateur.slug);
  if(schema?.engine === 'publicodes') {

    const aidesToEvaluate = schema?.dispositifs;

    console.log('schema', aidesToEvaluate);

    const {engine, calculateEligibility} = useEligibilityService()
    const eligibilityResults = calculateEligibility(simulateur.slug, simulateurVisibleAnswers, aidesToEvaluate)

    /*
    console.log("-------")
    console.log('eligibilityResults', eligibilityResults);
    console.log(simulateurVisibleAnswers)
    console.log("CII")
    console.log(engine.evaluate('CII . eligibilite'))
    console.log(engine.evaluate('CII . montantPlafonne'))
    console.log("-------")
    return;*/

    submissionStore.submitFormPublicodes(simulateur.slug, simulateurVisibleAnswers, eligibilityResults.aidesResults)
    .then((success: boolean) => {
      console.log('success submitFormPublicodes', success);
      if (success) {
        setTimeout(() => {
          // Inertia router redirection instead of window.location.href
          const secureHash = submissionStore.getSecureHash(simulateur.slug)
          router.visit(`/simulateurs/${simulateur.slug}/resultats/${secureHash}#simulateur-title`, {
            preserveState: true,
            preserveScroll: true,
          })
        }, 1000)
      }
      else {
        setTimeout(() => {
          resumeForm()
        }, 1500)
      }
    })


  } else {
    submissionStore
    .submitForm(simulateur.slug, simulateurVisibleAnswers)
    .then((success: boolean) => {
      if (success) {
        setTimeout(() => {
          // Inertia router redirection instead of window.location.href
          const secureHash = submissionStore.getSecureHash(simulateur.slug)
          router.visit(`/simulateurs/${simulateur.slug}/resultats/${secureHash}#simulateur-title`, {
            preserveState: true,
            preserveScroll: true,
          })
        }, 1000)
      }
      else {
        setTimeout(() => {
          resumeForm()
        }, 1500)
      }
    })
  }



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
              label: 'Recommencer',
              secondary: true,
              icon: { name: 'ri:refresh-line', ssr: true },
              onClick: restartForm,
            },
            {
              label: 'Reprendre',
              iconRight: true,
              icon: { name: 'ri:arrow-right-line', ssr: true },
              onClick: resumeForm,
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
              label: 'Commencer la simulation',
              iconRight: true,
              icon: { name: 'ri:arrow-right-line', ssr: true },
              onClick: resumeForm,
            },
          ]"
        />
      </template>

      <!-- Results status panel -->
      <div
        v-else-if="resultsFetchStatus !== 'idle'"
        class="status-panel"
      >
        <LoadingSpinner
          v-if="resultsFetchStatus === 'pending'"
          text="Estimation en cours..."
          size="lg"
        />
        <DsfrBadge
          v-else-if="resultsFetchStatus === 'success' || resultsFetchStatus === 'error'"
          :type="({
            success: 'success',
            error: 'error',
          }[resultsFetchStatus] as 'info' | 'success' | 'error')"
          :label="{
            success: 'Estimation terminée',
            error: 'Erreur lors de l\'estimation',
          }[resultsFetchStatus]"
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
