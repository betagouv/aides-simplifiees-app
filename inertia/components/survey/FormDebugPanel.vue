<script setup lang="ts">
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import { useSurveysStore } from '~/stores/surveys'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'show'>>()

const surveysStore = useSurveysStore()

const groupedQuestions = computed(() => surveysStore.getGroupedQuestions(simulateur.slug))
const currentStepId = computed(() => surveysStore.getCurrentStepId(simulateur.slug))
const currentPageId = computed(() => surveysStore.getCurrentPageId(simulateur.slug))
const progress = computed(() => surveysStore.getProgress(simulateur.slug))
</script>

<template>
  <div
    class="debug-panel fr-p-2w"
  >
    <h3 class="fr-h5 fr-mb-1w">
      Inspecteur du formulaire
    </h3>
    <div class="fr-text--sm">
      <div v-if="simulateur.slug">
        <strong>Simulateur:</strong> {{ simulateur.slug }}
      </div>
      <div>
        <strong>Étape courante :</strong> {{ currentStepId }}
      </div>
      <div>
        <strong>Page courante :</strong> {{ currentPageId }}
      </div>
      <div>
        <strong>Progression :</strong> {{ progress }}%
      </div>
    </div>

    <div
      v-if="groupedQuestions.length"
    >
      <div class="debug-panel__questions-header fr-mb-3v">
        <h4 class="fr-h6 fr-mb-0">
          Questions
        </h4>
        <div class="debug-panel__legend fr-text--xs fr-mb-0">
          <span class="debug-panel__legend-item debug-panel__question--current">courante</span>
          <span class="debug-panel__legend-item debug-panel__question--invisible">masquée</span>
          <span class="debug-panel__legend-item">
            <span class="debug-panel__answered fr-icon-success-line fr-icon--sm" /> Répondue
          </span>
        </div>
      </div>

      <div
        v-for="group in groupedQuestions"
        :key="group.title"
        class="debug-panel__question-group fr-mb-0"
      >
        <h5 class="fr-text--md fr-mb-0">
          {{ group.title }}
        </h5>
        <ul class="debug-panel__question-list fr-mt-0 fr-mb-2w fr-p-0">
          <li
            v-for="question in group.questions"
            :key="question.id"
            class="fr-text--sm fr-mb-0 fr-px-1w fr-py-1v"
            :class="{
              'debug-panel__question--current': surveysStore.isQuestionInCurrentPage(simulateur.slug, question.id),
              'debug-panel__question--invisible': !question.visible,
            }"
            :title="question.title"
          >
            <span>
              {{ question.id }}
            </span>
            <span
              v-if="question.answer !== null && question.answer !== undefined"
              class="debug-panel__answered fr-icon-success-line fr-icon--sm"
            >
              "{{ surveysStore.formatAnswer(simulateur.slug, question.id, question.answer) }}"
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.debug-panel {
  height: 48em;
  resize: vertical;
  border: 1px solid var(--border-default-grey);
  background-color: var(--background-default-grey);
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  &__questions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__legend-item {
    white-space: nowrap;
    padding: 0.25rem 0.5rem;
  }

  &__question-group {
    h5 {
      padding: 0.25rem 0.5rem;
      background-color: var(--background-contrast-grey);
    }
  }

  &__question-list {
    list-style-type: none;
    border: 1px solid var(--border-default-grey);

    li {
      border-bottom: 1px solid var(--border-default-grey);
      display: flex;
      justify-content: space-between;

      &:last-child {
        border-bottom: none;
      }
    }
  }

  &__question--current {
    background-color: var(--background-action-low-blue-france);
    font-weight: bold;
  }

  &__question--invisible {
    color: var(--text-disabled-grey);
    text-decoration: line-through;
  }
}
</style>
