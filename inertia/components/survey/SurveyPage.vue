<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import SurveyIntermediaryResultsPage from '~/components/survey/SurveyIntermediaryResultsPage.vue'
import SurveyQuestion from '~/components/survey/SurveyQuestion.vue'
import { useSurveysStore } from '~/stores/surveys'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'show'>>()

const surveysStore = useSurveysStore()

// Get simulateur-specific state
const currentPage = computed(() => surveysStore.getCurrentPage(simulateur.slug))
const visibleQuestionsInCurrentPage = computed(() => surveysStore.getVisibleQuestionsInCurrentPage(simulateur.slug))
</script>

<template>
  <div
    v-if="currentPage"
    data-testid="survey-page"
    class="fr-card fr-p-4w"
  >
    <h2
      v-if="currentPage?.title"
      class="fr-h4 fr-mb-3w"
    >
      {{ currentPage.title }}
    </h2>
    <!-- <h2
      v-else
      class="fr-sr-only"
    >
      @todo: Add a11y text for screen readers "Page x sur y de l'étape"
    </h2> -->
    <template v-if="(currentPage as SurveyQuestionsPage)?.questions">
      <template
        v-for="question in visibleQuestionsInCurrentPage"
        :key="question.id"
      >
        <SurveyQuestion
          :question="question"
          :simulateur-slug="simulateur.slug"
          :size="currentPage.title ? 'sm' : 'md'"
        />
      </template>
    </template>
    <template v-else-if="(currentPage as SurveyResultsPage)?.type === 'intermediary-results'">
      <SurveyIntermediaryResultsPage />
    </template>
  </div>
</template>
