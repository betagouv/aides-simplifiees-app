<template>
  <DsfrStepper
    v-if="pagination"
    :steps="stepTitles"
    :current-step="pagination.current"
    class="fr-mb-4w"
  />

  <!-- Questions -->
  <div v-for="[field, question] in page" :key="field.id" class="fr-mb-4w">
    <div v-if="!field.hidden">
      <SurveyQuestion
        :question="question"
        :simulateur-slug="'publicodes'"
        :useSurveyStore="false"
        :modelValue="
          field.value ??
          field.checked ??
          field.defaultValue ??
          field.defaultChecked
        "
        :required="field.required"
        @update:modelValue="handleInputChange(field.id, $event)"
      />
    </div>
  </div>

  <!-- Navigation -->
  <SurveyNavigation :buttons="navButtons" class="fr-mt-4w" />

  <div class="fr-card fr-p-4w" v-if="result">
    <h3 class="fr-h5">Résultat</h3>
    <div v-html="result"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DsfrStepper } from "@gouvminint/vue-dsfr";
import SurveyQuestion from "~/components/survey/SurveyQuestion.vue";
import SurveyNavigation from "~/components/survey/SurveyNavigation.vue";
import { usePublicodesForm } from "~/composables/use_publicodes_form";
import { RawPublicodes } from "publicodes";

interface Props {
  rules: RawPublicodes<string>;
  title?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [answers: Record<string, any>];
  change: [answers: Record<string, any>];
}>();

// Form state
const {
  currentPage,
  pagination,
  situation,
  handleInputChange,
  goToNextPage,
  goToPreviousPage,
  result,
} = usePublicodesForm({
  rules: props.rules,
});

const page = computed(() =>
  currentPage.value.map(
    (field) => [field, mapToSurveyQuestion(field)] as const,
  ),
);

// Map publicodes field to survey question
const mapToSurveyQuestion = (field: any): SurveyQuestion => {
  let choices: SurveyChoice[] | undefined;
  let type;
  if (field.element === "checkbox") {
    type = "checkbox";
  } else if (field.element === "input" && field.type === "number") {
    type = "number";
  } else if (field.element === "input" && field.type === "date") {
    type = "date";
  } else if (
    field.element === "RadioGroup" &&
    field.options.every(({ label }) => label === "Oui" || label === "Non")
  ) {
    type = "boolean";
  } else if (field.element === "RadioGroup") {
    type = "radio";
    choices = field.options.map(({ label, description }) => ({
      id: label,
      title: label,
      tooltip: description,
    }));
  } else {
    console.log("Unknown field type:", field);
    type = "combobox";
  }

  return {
    id: field.id,
    title: field.label,
    description: field.description,
    type,
    choices,
    placeholder: field.placeholder,
    min: field.min,
    max: field.max,
    step: field.step,
  } as SurveyQuestion;
};

// Handle answer changes
const handleChange = (fieldId: string, value: any) => {
  console.log("Field changed:", fieldId, value);
  handleInputChange(fieldId, value);
  emit("change", situation.value);
};

// Step titles
const stepTitles = computed(() => {
  if (!pagination.value) return [];
  return Array.from(
    { length: pagination.value.pageCount },
    (_, i) => `Étape ${i + 1}`,
  );
});

// Navigation buttons
const navButtons = computed(() => {
  const buttons = [];

  if (pagination.value?.hasPreviousPage) {
    buttons.push({
      label: "Précédent",
      secondary: true,
      icon: "ri:arrow-left-line",
      onClick: goToPreviousPage,
    });
  }

  if (pagination.value?.hasNextPage) {
    buttons.push({
      label: "Suivant",
      icon: "ri:arrow-right-line",
      iconRight: true,
      onClick: goToNextPage,
    });
  }

  return buttons;
});
</script>

<style scoped>
.text-center {
  text-align: center;
}
</style>
