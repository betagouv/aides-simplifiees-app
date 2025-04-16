<script lang="ts" setup>
definePageMeta({
  layout: 'user-simulation',
  middleware: [
    'check-iframe-layout',
    'load-simulateur',
  ],
  validate: getContentRouteValidator(['simulateur_id'])
})

const route = useRoute()
const nuxtApp = useNuxtApp()
const simulateurId = route.params.simulateur_id as string
const simulateur = nuxtApp.payload.data[`simulateur-${simulateurId}`]
const simulateurTitle = simulateur?.titre || simulateurId

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle, to: `/simulateurs/${simulateurId}#simulateur-title` },
  { text: 'Récapitulatif', to: `/simulateurs/${simulateurId}/${route.params.notion_id}#simulateur-title` }
])

const surveysStore = useSurveysStore()
surveysStore.loadSurveySchema(simulateurId)

const groupedQuestions = computed(() => surveysStore.getGroupedAnsweredQuestions(simulateurId))
const currentQuestionId = computed(() => surveysStore.getCurrentQuestionId(simulateurId))
// const currentStepId = computed(() => surveysStore.getCurrentStepId(simulateurId.value))
// const progress = computed(() => surveysStore.getProgress(simulateurId.value))
const activeQuestionGroupIndex = computed(() => {
  const questionGroups = groupedQuestions.value
  const currentQuestionIdValue = currentQuestionId.value
  return questionGroups.findIndex(group =>
    group.questions.some(question => question.id === currentQuestionIdValue)
  )
})
const activeAccordion = ref<number>(activeQuestionGroupIndex.value)
</script>

<template>
  <div
    v-if="simulateur"
  >
    <hgroup class="fr-mb-4w">
      <h2>
        Récapitulatif des informations que vous avez renseignées
      </h2>
      <DsfrLink
        class="results__backlink"
        icon-before
        label="Revenir à la question en cours"
        :to="`/simulateurs/${simulateurId}#simulateur-title`"
        :icon="{ name: 'ri:arrow-left-line', ssr: true }"
      />
    </hgroup>
    <div
      class="fr-card fr-p-3w"
    >
      <DsfrAccordionsGroup v-model="activeAccordion">
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
              class="question-row fr-mb-2w"
            >
              <div>
                <p class="fr-text--bold">
                  {{ question.title }}
                </p>
                <DsfrBadge
                  v-if="question.id === currentQuestionId"
                  class="fr-mt-1w"
                  type="info"
                  small
                  label="Question en cours"
                />
                <p
                  v-if="surveysStore.hasAnswer(simulateurId, question.id)"
                  class="fr-hint-text fr-text--sm"
                >
                  "{{ surveysStore.formatAnswer(simulateurId, question.id, question.answer) }}"
                </p>
              </div>
              <DsfrButton
                tertiary
                size="sm"
                no-outline
                :icon="{ name: 'ri:edit-line', ssr: true }"
                icon-right
                :label="surveysStore.hasAnswer(simulateurId, question.id) ? 'Modifier' : 'Répondre'"
                @click.prevent="() => {
                  surveysStore.setCurrentQuestionId(simulateurId, question.id)
                  navigateTo(`/simulateurs/${simulateurId}#simulateur-title`)
                }"
              />
            </div>
          </DsfrAccordion>
        </template>
      </DsfrAccordionsGroup>
    </div>
  </div>
</template>

<style lang="css" scoped>
.question-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}
.question-row:last-child {
  border-bottom: none;
}
.question-row p {
  margin: 0;
}
</style>
