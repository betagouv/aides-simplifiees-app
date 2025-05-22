<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAccordion, DsfrAccordionsGroup, DsfrBadge, DsfrButton } from '@gouvminint/vue-dsfr'
import { Head, router, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import DsfrLink from '~/components/DsfrLink.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { useSurveysStore } from '~/stores/surveys'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'showRecapitulatif'>>()

const simulateurTitle = simulateur.title || simulateur.slug

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle, to: `/simulateurs/${simulateur.slug}#simulateur-title` },
  {
    text: 'Récapitulatif',
    to: `/simulateurs/${simulateur.slug}/recapitulatif`,
  },
])

const surveysStore = useSurveysStore()
surveysStore.loadSurveySchema(simulateur.slug)

const groupedQuestions = computed(() => surveysStore.getGroupedAnsweredQuestions(simulateur.slug))
const currentQuestionId = computed(() => surveysStore.getCurrentQuestionId(simulateur.slug))
const activeQuestionGroupIndex = computed(() => {
  const questionGroups = groupedQuestions.value
  const currentQuestionIdValue = currentQuestionId.value
  return questionGroups.findIndex(group =>
    group.questions.some(question => question.id === currentQuestionIdValue),
  )
})
const activeAccordion = ref<number>(activeQuestionGroupIndex.value)
</script>

<template>
  <Head
    :title="`Récapitulatif de votre simulation '${simulateur.title}'`"
    :description="`Découvrez les aides auxquelles vous êtes eligibles avec le récapitulatif de votre simulation '${simulateur.title}'.`"
  />
  <div v-if="simulateur">
    <hgroup class="fr-mb-4w">
      <h2>Récapitulatif des informations que vous avez renseignées</h2>
      <DsfrLink
        class="results__backlink"
        icon-before
        label="Revenir à la question en cours"
        :to="`/simulateurs/${simulateur.slug}#simulateur-title`"
        preserve-scroll
        preserve-state
        :icon="{ name: 'ri:arrow-left-line', ssr: true }"
      />
    </hgroup>
    <div class="fr-card fr-p-3w">
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
                  v-if="surveysStore.hasAnswer(simulateur.slug, question.id)"
                  class="fr-hint-text fr-text--sm"
                >
                  "{{ surveysStore.formatAnswer(simulateur.slug, question.id, question.answer) }}"
                </p>
              </div>
              <DsfrButton
                tertiary
                size="sm"
                no-outline
                :icon="{ name: 'ri:edit-line', ssr: true }"
                icon-right
                :label="surveysStore.hasAnswer(simulateur.slug, question.id) ? 'Modifier' : 'Répondre'"
                @click.prevent="() => {
                  surveysStore.setCurrentQuestionId(simulateur.slug, question.id)
                  router.visit(`/simulateurs/${simulateur.slug}#simulateur-title`)
                }"
              />
            </div>
          </DsfrAccordion>
        </template>
      </DsfrAccordionsGroup>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
