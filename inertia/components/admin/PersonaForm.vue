<script setup lang="ts">
import type AdminPersonaController from '#controllers/admin/admin_persona_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAccordion, DsfrAccordionsGroup, DsfrAlert, DsfrButtonGroup, DsfrInputGroup, DsfrSelect } from '@gouvminint/vue-dsfr'
import { useForm } from '@inertiajs/vue3'
import { computed, customRef, ref, watch } from 'vue'
import AdminForm from '~/components/admin/AdminItemFormContainer.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import SurveyQuestion from '~/components/survey/SurveyQuestion.vue'
import { useSimulation } from '~/composables/use_simulation'
import { useSurveysStoreDefiner } from '~/composables/use_surveys_store_definer'

const props = defineProps<{
  simulateur: InferPageProps<AdminPersonaController, 'edit' | 'create'>['simulateur']
  defaultValues?: InferPageProps<AdminPersonaController, 'edit' | 'create'>['persona']
}>()

defineEmits<{
  (e: 'submit', form: PersonaFormType): void
  (e: 'cancel'): void
}>()

// Initialize form with default values or empty strings
const form = useForm({
  name: props.defaultValues?.name || '',
  description: props.defaultValues?.description || '',
  status: props.defaultValues?.status || 'active',
  testData: props.defaultValues?.testData || {},
})

const surveysStore = useSurveysStoreDefiner({ enableMatomo: false })()
surveysStore.loadSchema(props.simulateur.slug)
const groupedQuestions = computed(() => surveysStore.getGroupedVisibleQuestions(props.simulateur.slug))
const schemaStatus = computed(() => surveysStore.schemaStatus.value[props.simulateur.slug])
const areAllRequiredQuestionsAnswered = computed(() => surveysStore.areAllRequiredQuestionsAnswered(props.simulateur.slug))

const { results, status, runSimulation, error: simulationError } = useSimulation()
const testDataModel = customRef((track, trigger) => {
  return {
    get() {
      track()
      return JSON.stringify(form.testData, null, 2)
    },
    set(value: string) {
      try {
        form.testData = JSON.parse(value)
        form.clearErrors('testData')
      }
      catch (e) {
        console.error('JSON parsing error:', e)
        form.setError('testData', 'Format JSON invalide')
      }
      trigger()
    },
  }
})

watch([form.testData, schemaStatus], () => {
  loadTestDataIntoForm()
}, { deep: true })

function loadTestDataIntoForm() {
  if (
    schemaStatus.value === 'success'
    && form.testData
    && typeof form.testData === 'object'
  ) {
    Object.entries(form.testData).forEach(([questionId, value]) => {
      if (value !== undefined && value !== null) {
        surveysStore.setAnswer(props.simulateur.slug, questionId, value)
      }
    })
  }
}

function saveFormDataToTestData() {
  const answers = surveysStore.getAnswers(props.simulateur.slug)
  testDataModel.value = JSON.stringify(answers, null, 2)
}

async function handleRunSimulation() {
  const answers = surveysStore.getAnswersForCalculation(props.simulateur.slug)
  const schema = surveysStore.getSchema(props.simulateur.slug)
  if (!schema) {
    console.error(`Schema not found for simulateur: ${props.simulateur.slug}`)
    return
  }
  await runSimulation(answers, schema)
}

const activeAccordion = ref<number>()
</script>

<template>
  <AdminForm
    :form="form"
    @submit="$emit('submit', form)"
    @cancel="$emit('cancel')"
  >
    <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">
      <div class="fr-col-12 fr-col-md-8">
        <DsfrInputGroup
          v-model="form.name"
          label="Nom du persona"
          label-visible
          placeholder="Ex: Famille monoparentale avec 2 enfants"
          required
          :error="form.errors.name"
        />
      </div>
      <div class="fr-col-12 fr-col-md-4">
        <DsfrSelect
          v-model="form.status"
          label="Statut"
          :options="[
            { value: 'active', text: 'Actif' },
            { value: 'inactive', text: 'Inactif' },
          ]"
          required
          :error="form.errors.status"
        />
      </div>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">
      <div class="fr-col-12">
        <DsfrInputGroup
          v-model="form.description"
          label="Description"
          is-textarea
          label-visible
          hint="Description de cette persona et de son contexte"
          placeholder="Description de cette persona et de son contexte..."
          :error="form.errors.description"
        />
      </div>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">
      <div class="fr-col-12">
        <DsfrInputGroup
          v-model="testDataModel"
          label="Réponses de référence du persona"
          is-textarea
          label-visible
          hint="Données au format JSON qui correspondent aux réponses de références définies pour ce persona. Elles seront utilisées pour pré-remplir le formulaire du simulateur."
          placeholder="{&quot;age&quot;: 25, &quot;revenus&quot;: 2000}"
          :rows="10"
          :error-message="form.errors.testData"
          :valid-message="form.errors.testData ? '' : 'Format JSON valide'"
        />
      </div>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">
      <div class="fr-col-6">
        <div class="fr-card fr-p-4w form-container">
          <hgroup class="fr-mb-3w">
            <h3 class="fr-h4 fr-mb-1w">
              Formulaire du simulateur
            </h3>
            <p class="fr-hint-text">
              Le formulaire ci-dessous est pré-rempli avec les données du persona. Vous pouvez modifier les réponses pour simuler différents scénarios.
            </p>
          </hgroup>
          <DsfrAccordionsGroup
            v-model="activeAccordion"
          >
            <template
              v-for="(group, i) in groupedQuestions"
              :key="group.title"
            >
              <DsfrAccordion
                v-if="group.questions.length"
                :title="`${i + 1}. ${group.title}`"
              >
                <div
                  v-for="question in group.questions"
                  :key="question.id"
                  class="fr-mb-4w"
                >
                  <SurveyQuestion
                    :question="(surveysStore.findQuestionById(props.simulateur.slug, question.id) as SurveyQuestionData)"
                    :store="surveysStore"
                    :simulateur-slug="simulateur.slug"
                  />
                </div>
              </DsfrAccordion>
            </template>
          </DsfrAccordionsGroup>
        </div>
      </div>
      <div class="fr-col-6">
        <DsfrButtonGroup
          class="fr-mb-2w"
          equisized
          inline-layout-when="always"
          :buttons="[
            {
              label: 'Lancer une simulation avec les données du formulaire',
              icon: { name: 'ri:play-line', ssr: true },
              disabled: (
                status === 'pending'
                || !areAllRequiredQuestionsAnswered
              ),
              type: 'button',
              onClick: handleRunSimulation,
            },
            {
              label: 'Restaurer le formulaire avec les réponses de référence du persona',
              icon: { name: 'ri:refresh-line', ssr: true },
              type: 'button',
              secondary: true,
              onClick: loadTestDataIntoForm,
            },
            {
              label: 'Appliquer les données du formulaire aux réponses de référence du persona',
              icon: { name: 'ri:save-2-line', ssr: true },
              type: 'button',
              secondary: true,
              onClick: saveFormDataToTestData,
            },
          ]"
        />
        <!-- Status de la simulation -->
        <div
          v-if="status !== 'idle'"
          class="fr-mb-3w"
        >
          <LoadingSpinner
            v-if="status === 'pending'"
            text="Simulation en cours..."
            size="sm"
          />
          <DsfrAlert
            v-else-if="status === 'error'"
            type="error"
            :title="simulationError || 'Erreur lors de la simulation'"
            small
          />
        </div>

        <!-- Résultats de la simulation -->
        <div
          v-if="results && status === 'success'"
          class="fr-card fr-p-3w"
        >
          <h3 class="fr-h5 fr-mb-3w">
            Résultats de la simulation
          </h3>
          <div
            v-if="Object.keys(results).length > 0"
            class="simulation-results"
          >
            <div
              v-for="(value, key) in results"
              :key="key"
              class="fr-mb-1w"
            >
              <span class="fr-text--bold">{{ key }} : </span>
              <span
                v-if="typeof value === 'boolean'"
                :class="value ? 'fr-text--success' : 'fr-text--error'"
              >
                {{ value ? 'Éligible' : 'Non éligible' }}
              </span>
              <span
                v-else-if="typeof value === 'number'"
                class="fr-text--info"
              >
                {{ value }}€
              </span>
              <span v-else>{{ value }}</span>
            </div>
          </div>
          <p
            v-else
            class="fr-text--sm fr-mb-0"
          >
            Aucune aide trouvée pour cette configuration.
          </p>
        </div>
      </div>
    </div>
  </AdminForm>
</template>

<style lang="scss" scoped>
.form-container {
  max-height: 75vh;
  overflow-y: auto;
}

.simulation-results {
  // font-family: 'Courier New', monospace;
  font-size: 0.875rem;

  .fr-text--success {
    color: var(--text-default-success);
  }

  .fr-text--error {
    color: var(--text-default-error);
  }

  .fr-text--info {
    color: var(--text-default-info);
  }
}
</style>
