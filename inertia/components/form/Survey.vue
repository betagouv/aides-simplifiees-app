<script lang="ts" setup>
import { computed, onMounted, onUnmounted, toRef, ref, watch } from 'vue'
import { router, usePage } from '@inertiajs/vue3'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { useIframeDisplay } from '~/composables/useIframeDisplay'
import { useMatomo } from '~/composables/useMatomo'
import SurveyForm from './SurveyForm.vue'
import LoadingSpinner from '~/components/shared/LoadingSpinner.vue'
import DsfrLink from '../DsfrLink.vue'

// Définir les props
const props = defineProps<{
  simulateurId: string
}>()
const simulateurId = toRef(() => props.simulateurId)

// Références pour les données réactives
const schemaStatus = ref('pending')
const showWelcomeScreen = ref(false)
const showChoiceScreen = ref(false)
const resultsFetchStatus = ref('idle')
const progress = ref(0)

// Références pour les éléments du DOM
const surveyH1 = ref('h2')
const surveyH2 = ref('h3')

// Vérifier si nous sommes côté client
const isClient = typeof window !== 'undefined'

// Initialiser les stores uniquement côté client
let surveysStore: any = null
let submissionStore: any = null
let matomo: any = null

// Fonction pour faire défiler jusqu'à l'ancre spécifiée
function scrollToAnchor(anchorId: string): void {
  if (!isClient) return

  setTimeout(() => {
    const element = document.getElementById(anchorId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

// Initialisation du sondage
function initSurvey() {
  if (!isClient || !surveysStore) return

  // Charger le schéma
  surveysStore.loadSurveySchema(simulateurId.value)

  // Suivre le début du formulaire dans Matomo
  if (matomo) {
    matomo.trackSurveyStart(simulateurId.value)
  }

  // Afficher l'écran approprié
  const hasAnswers = surveysStore.hasAnswers(simulateurId.value)
  if (hasAnswers) {
    showChoiceScreen.value = true
    showWelcomeScreen.value = false
  } else {
    showChoiceScreen.value = false
    showWelcomeScreen.value = true
  }
}

// Reprendre le formulaire
function resumeForm() {
  if (!isClient || !surveysStore || !submissionStore) return

  submissionStore.setSubmissionStatus(simulateurId.value, 'idle')
  showChoiceScreen.value = false
  showWelcomeScreen.value = false
  scrollToAnchor('simulateur-title')
}

// Redémarrer le formulaire
function restartForm() {
  if (!isClient || !surveysStore || !submissionStore) return

  submissionStore.setSubmissionStatus(simulateurId.value, 'idle')
  surveysStore.resetSurvey(simulateurId.value)
  showChoiceScreen.value = false
  showWelcomeScreen.value = true
  scrollToAnchor('simulateur-title')
}

// Gérer la soumission du formulaire
function handleFormComplete(): void {
  if (!isClient || !surveysStore || !submissionStore) return

  const simulateurAnswers = surveysStore.getAnswers(simulateurId.value)
  submissionStore.submitForm(simulateurId.value, simulateurAnswers).then((success: boolean) => {
    if (success) {
      setTimeout(() => {
        //Inertia router redirection instead of window.location.href
        const secureHash = submissionStore.getSecureHash(simulateurId.value)
        router.visit(`/simulateurs/${simulateurId.value}/resultats/${secureHash}#simulateur-title`)

        //window.location.href = `/simulateurs/${simulateurId.value}/resultats#simulateur-title`
      }, 1000)
    } else {
      setTimeout(() => {
        resumeForm()
      }, 1500)
    }
  })
}

// Initialisation côté client uniquement
onMounted(() => {
  // Importer les stores
  import('~/stores/survey').then((module) => {
    const { useSurveysStore } = module
    surveysStore = useSurveysStore()

    import('~/stores/submissions').then((module) => {
      const { useSubmissionStore } = module
      submissionStore = useSubmissionStore()

      // Initialize submission status to 'idle' if not already set
      if (!submissionStore.getSubmissionStatus(simulateurId.value)) {
        submissionStore.setSubmissionStatus(simulateurId.value, 'idle')
      }

      // Setup a watcher for schema status changes
      watch(
        () => surveysStore.getSchemaStatus(simulateurId.value),
        (status: string) => {
          schemaStatus.value = status
        },
        { immediate: true }
      )

      // Mettre à jour les états réactifs
      progress.value = surveysStore.getProgress(simulateurId.value)
      showWelcomeScreen.value = surveysStore.getShowWelcomeScreen(simulateurId.value)
      showChoiceScreen.value = surveysStore.getShowChoiceScreen(simulateurId.value)
      resultsFetchStatus.value = submissionStore.getSubmissionStatus(simulateurId.value)

      // Configurer les listeners
      surveysStore.onComplete(simulateurId.value, handleFormComplete)

      // Configurer Matomo
      matomo = useMatomo()

      // Configurer iframe display
      const { isIframe } = useIframeDisplay()
      if (isIframe.value) {
        surveyH1.value = 'h1'
        surveyH2.value = 'h2'

        // Charger le script iframe-resizer
        const script = document.createElement('script')
        script.src = '/scripts/iframeResizer.contentWindow.min.js'
        script.async = true
        document.head.appendChild(script)
      }

      // Vérifier si nous devons reprendre le formulaire
      const currentParams = new URLSearchParams(window.location.search)
      const forceResume = currentParams.get('resume') === 'true'

      if (forceResume) {
        resumeForm()
      } else {
        initSurvey()
      }
    })
  })
})

// Nettoyage à la suppression du composant
onUnmounted(() => {
  if (isClient && surveysStore) {
    surveysStore.offComplete(simulateurId.value, handleFormComplete)
  }
})
</script>

<template>
  <div>
    <component :is="surveyH1" class="fr-sr-only"> Votre simulation </component>

    <LoadingSpinner v-if="schemaStatus === 'pending'" />
    <DsfrAlert
      v-else-if="schemaStatus === 'error'"
      aria-live="assertive"
      type="error"
      title="Erreur lors du chargement du formulaire"
    />

    <template v-else-if="schemaStatus === 'success'">
      <!-- Choice screen for resuming or restarting -->
      <div v-if="showChoiceScreen">
        <div class="fr-card fr-p-4w">
          <component :is="surveyH2" class="fr-h4">
            Vous avez déjà commencé une simulation
          </component>
          <DsfrBadge class="fr-mt-n1w fr-mb-2w" type="info" :label="`Progression : ${progress}%`" />
          <p class="fr-text--lg fr-mb-0">
            Souhaitez-vous reprendre votre simulation ou la recommencer ?
          </p>
        </div>
        <DsfrButtonGroup
          class="fr-mt-3w"
          align="right"
          size="lg"
          inline-layout-when="md"
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
      </div>

      <!-- Welcome screen for starting the survey -->
      <div v-else-if="showWelcomeScreen">
        <div class="fr-card fr-p-4w">
          <component :is="surveyH2" class="fr-h4"> Un simulateur en construction </component>
          <p>
            <span class="fr-text--bold">Bienvenue !</span>
            Ce simulateur vous permet d'estimer 5 aides financières pour le logement et le
            déménagement, en particulier destinées aux étudiants.
            <DsfrLink
              to="/aides"
              target="_blank"
              label="Consulter la liste des aides couvertes."
              :icon="{ name: 'ri:arrow-right-line', ssr: true }"
            />
          </p>
          <p>Nous continuons à l'améliorer. Vos retours sont précieux :</p>
          <ul class="fr-mt-n2w fr-mb-2w">
            <li>
              Par mail à l'adresse
              <DsfrLink
                to="mailto:aides.simplifiees@numerique.gouv.fr"
                :icon="{ name: 'ri:mail-line', ssr: true }"
                label="aides.simplifiees@numerique.gouv.fr"
              />
            </li>
            <li>
              Via
              <DsfrLink
                :icon="{ name: 'ri:external-link-line', ssr: true }"
                to="https://tally.so/r/w27b9D"
                target="_blank"
                label="le questionnaire de satisfaction"
              />
            </li>
          </ul>
          <p>Merci pour votre aide !</p>
          <p>
            En accédant à ce service, vous reconnaissez avoir pris connaissance et accepté les
            <DsfrLink
              :icon="{ name: 'ri:external-link-line', ssr: true }"
              to="/content/cgu"
              label="Conditions Générales d'Utilisation"
              target="_blank"
            />
          </p>
        </div>

        <DsfrButtonGroup
          class="fr-mt-4w"
          inline-layout-when="md"
          size="lg"
          align="right"
          :buttons="[
            {
              label: 'Commencer la simulation',
              iconRight: true,
              icon: { name: 'ri:arrow-right-line', ssr: true },
              onClick: resumeForm,
            },
          ]"
        />
      </div>

      <!-- Results status panel -->
      <div v-else-if="resultsFetchStatus !== 'idle'" class="status-panel">
        <LoadingSpinner
          v-if="resultsFetchStatus === 'pending'"
          text="Estimation en cours..."
          size="lg"
        />
        <DsfrBadge
          v-if="resultsFetchStatus === 'error' || resultsFetchStatus === 'success'"
          class="survey-fetch-status-badge"
          :type="
            {
              // idle: 'info',
              loading: 'info',
              success: 'success',
              error: 'error',
            }[resultsFetchStatus] as 'info' | 'success' | 'error'
          "
          :label="
            {
              // idle: `progression : ${progress}%`,
              loading: 'Estimation en cours...',
              success: 'Estimation terminée',
              error: 'Erreur lors de l\'estimation',
            }[resultsFetchStatus]
          "
        />
      </div>

      <!-- Survey form -->
      <SurveyForm v-else :simulateur-id="simulateurId" />
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

.loading-indicator {
  color: var(--text-mention-grey);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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
