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
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useMatomo } from '~/composables/use_matomo'
import { useSubmissionStore } from '~/stores/submissions'
import { useSurveysStore } from '~/stores/surveys'
import { scrollToAnchor } from '~/utils/dom'
import { getParam } from '~/utils/url'



//Test publicodes
import Engine, { formatValue } from 'publicodes';
import sourceRules from '@publicodes-build/index';


onMounted(() => {
  //Make sure it calculated on the front
  const engine = new Engine(sourceRules);
  const dépenses = engine.evaluate('dépenses primeur');
  console.log(`J'ai dépensé ${formatValue(dépenses)} chez le primeur.`);
  engine.setSituation({
      'prix . avocat': '3€/avocat'
  });
  const dépenses2 = engine.evaluate('dépenses primeur');
  console.log(`J'ai dépensé ${formatValue(dépenses2)} chez le primeur.`);

  const depensesParJour = engine.evaluate('dépenses primeur / 7 jours');
  console.log(`J'ai dépensé ${formatValue(depensesParJour)}.`);
})



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
surveysStore.loadSurveySchema(simulateur.slug)

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

onMounted(() => {
  surveysStore.onComplete(simulateur.slug, handleFormComplete)
})
onBeforeUnmount(() => {
  surveysStore.deleteCompleteListeners()
})

// Heading levels based on iframe context
const { isIframe } = useIframeDisplay()
const surveyH1 = computed(() => isIframe.value ? 'h1' : 'h2')
</script>

<template>
  <div>
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
