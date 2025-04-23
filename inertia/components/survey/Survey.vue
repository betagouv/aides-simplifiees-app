<script lang="ts" setup>
import { DsfrAlert, DsfrBadge } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { computed, onMounted, onUnmounted } from 'vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import SurveyChoiceScreen from '~/components/survey/SurveyChoiceScreen.vue'
import SurveyForm from '~/components/survey/SurveyForm.vue'
import SurveyNavigation from '~/components/survey/SurveyNavigation.vue'
import SurveyWelcomeScreen from '~/components/survey/SurveyWelcomeScreen.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useMatomo } from '~/composables/use_matomo'
import { useSubmissionStore } from '~/stores/submissions'
import { useSurveysStore } from '~/stores/surveys'
import { scrollToAnchor } from '~/utils/dom'
import { getParam } from '~/utils/url'

const page = usePage<{
  simulateur: {
    pictogramPath: string
    title: string
    slug: string
  }
}>()
const simulateurId = computed(() => page.props.simulateur.slug)

// Form schema loading and state management
const surveysStore = useSurveysStore()
// Get per-simulateur state
const schemaStatus = computed(() => surveysStore.getSchemaStatus(simulateurId.value))
const hasAnswers = computed(() => surveysStore.hasAnswers(simulateurId.value))
const progress = computed(() => surveysStore.getProgress(simulateurId.value))
const showWelcomeScreen = computed(() => surveysStore.getShowWelcomeScreen(simulateurId.value))
const showChoiceScreen = computed(() => surveysStore.getShowChoiceScreen(simulateurId.value))

// Form submission
const submissionStore = useSubmissionStore()
const resultsFetchStatus = computed(() => submissionStore.getSubmissionStatus(simulateurId.value))

const forceResume = computed(() => {
  return getParam(page.url, 'resume') === 'true'
})

// Fetch the survey schema
surveysStore.loadSurveySchema(simulateurId.value)

if (forceResume.value && hasAnswers.value) {
  // Resume the form if the query parameter is present
  resumeForm()
}
else {
  initSurvey()
}

// Full survey initialization, including Matomo tracking
function initSurvey() {
  // Track form start in Matomo
  useMatomo().trackSurveyStart(simulateurId.value)
  // Show the choice screen if there are answers
  if (hasAnswers.value) {
    surveysStore.setShowChoiceScreen(simulateurId.value, true)
    surveysStore.setShowWelcomeScreen(simulateurId.value, false)
  }
  else {
    // Show the welcome screen if there are no answers
    surveysStore.setShowChoiceScreen(simulateurId.value, false)
    surveysStore.setShowWelcomeScreen(simulateurId.value, true)
  }
}

function resumeForm() {
  submissionStore.setSubmissionStatus(simulateurId.value, 'idle')
  surveysStore.setShowChoiceScreen(simulateurId.value, false)
  surveysStore.setShowWelcomeScreen(simulateurId.value, false)
  scrollToAnchor('simulateur-title')
}

// Restart the form from the beginning
function restartForm() {
  submissionStore.setSubmissionStatus(simulateurId.value, 'idle')
  surveysStore.resetSurvey(simulateurId.value)
  surveysStore.setShowChoiceScreen(simulateurId.value, false)
  surveysStore.setShowWelcomeScreen(simulateurId.value, true)
  scrollToAnchor('simulateur-title')
}

// Gérer la soumission du formulaire
function handleFormComplete(): void {
  const simulateurAnswers = surveysStore.getAnswers(simulateurId.value)
  submissionStore.submitForm(simulateurId.value, simulateurAnswers).then((success: boolean) => {
    if (success) {
      setTimeout(() => {
        // Inertia router redirection instead of window.location.href
        const secureHash = submissionStore.getSecureHash(simulateurId.value)
        router.visit(`/simulateurs/${simulateurId.value}/resultats/${secureHash}#simulateur-title`)
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
  surveysStore.onComplete(simulateurId.value, handleFormComplete)
})
onUnmounted(() => {
  surveysStore.offComplete(simulateurId.value, handleFormComplete)
})

// Heading levels based on iframe context
const { isIframe } = useIframeDisplay()
const surveyH1 = computed(() => isIframe.value ? 'h1' : 'h2')
</script>

<template>
  <div
    class="survey"
    :class="{
      'survey--iframe': isIframe,
      'survey--no-iframe': !isIframe,
    }"
  >
    <component
      :is="surveyH1"
      class="fr-sr-only"
    >
      Votre simulation
    </component>

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
        <SurveyWelcomeScreen />
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
      <SurveyForm
        v-else
        :simulateur-id="simulateurId"
      />
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
