<script lang="ts" setup generic="T, U">
const props = withDefaults(defineProps<{
  question: SurveyQuestion
  autocompleteFn: AutocompleteFn
  autocompleteConfig?: SurveyQuestionAutocompleteConfig
}>(), {
  autocompleteConfig: () => ({})
})

const defaultConfig = {
  placeholder: 'Rechercher',
  buttonText: 'Rechercher',
  loadingText: 'Chargement des suggestions...',
  selectLabel: 'Sélectionner une option dans la liste ci-dessous',
  selectHint: (query: string) => `Il s'agit des options proches de votre recherche : « ${query} »`,
  noResultsText: 'Aucun résultat trouvé pour votre recherche',
  errorTitle: 'Erreur lors de la recherche',
  errorDescription: 'Veuillez réessayer plus tard.',
  defaultUnselectedText: 'Sélectionner une option',
  resetButtonLabel: 'Réinitialiser',
}

const config = {
  ...defaultConfig,
  ...props.autocompleteConfig
}

const model = defineModel<string | undefined>()
const query = ref<string>('') // state for the input field
const lastSentQuery = ref<string>('') // state for the last sent query
const searchResultsId = `search-results-${props.question.id}`
const searchInputId = `search-input-${props.question.id}`
const selectId = `options-${props.question.id}`

// Reference to elements for focus management
const selectElement = ref<HTMLElement | null>(null)
const searchInput = ref<ComponentPublicInstance | null>(null)
const noResultsAlert = ref<HTMLElement | null>(null)

// Add a new ref for tracking the active option in the dropdown
const activeDescendant = ref<string | null>(null)
const optionsContainerId = `options-list-${props.question.id}`
const comboboxId = `combobox-${props.question.id}`

const { data: selectOptions, status, refresh, clear } = useAsyncData(
  `autocomplete-${props.question.id}`,
  () => props.autocompleteFn(query.value),
  {
    lazy: true,
    immediate: false,
    default: () => [],
  }
)

const debounceStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const statusMessage = ref<string>('')

watch(status, (newStatus) => {
  if (newStatus === 'success') {
    setTimeout(() => {
      debounceStatus.value = 'success' // Set to success after a delay to allow for UI updates
      if (selectOptions.value.length > 0) {
        statusMessage.value = `${selectOptions.value.length} options trouvées pour votre recherche "${lastSentQuery.value}"`
        // Move focus to the select element when results appear
        nextTick(() => {
          if (selectElement.value) {
            selectElement.value.focus()
          }
        })
      }
      else {
        statusMessage.value = config.noResultsText
      }
    }, 400)
  }
  else if (newStatus === 'error') {
    debounceStatus.value = newStatus
    statusMessage.value = `${config.errorTitle}. ${config.errorDescription}`
  }
  else {
    debounceStatus.value = newStatus
    if (newStatus === 'pending') {
      statusMessage.value = config.loadingText
    }
  }
})

function handleSearch () {
  if (query.value.trim()) {
    refresh()
    lastSentQuery.value = query.value
    model.value = undefined
  }
}

function clearInput () {
  query.value = ''
  model.value = undefined
  clear()
  statusMessage.value = 'Recherche réinitialisée'
  // Return focus to search input after clearing
  nextTick(() => {
    searchInput.value?.$el?.querySelector?.('input')?.focus()
  })
}

// Enhanced focus management for autocomplete list
function handleOptionFocus (optionId: string) {
  activeDescendant.value = optionId
}

const { getHistory, addHistory } = useAutoCompleteHistoryStore()
// Track when options are selected
function handleOptionSelect (value: string | number) {
  const option = selectOptions.value.find((opt) => {
    return (opt as { value: string, text: string }).value === value
  }) as { value: string, text: string }
  addHistory(props.question.id, value, option.text)
  statusMessage.value = `Option "${value}" sélectionnée`
}
const selectedValue = computed(() => {
  if (model.value) {
    return getHistory(props.question.id, model.value)
  }
  return null
})
</script>

<template>
  <div
    :id="comboboxId"
    role="combobox"
    data-testid="combobox"
    :aria-expanded="debounceStatus === 'success' && selectOptions.length > 0"
    :aria-owns="optionsContainerId"
    aria-haspopup="listbox"
    aria-autocomplete="list"
  >
    <DsfrSearchBar
      :id="searchInputId"
      ref="searchInput"
      v-model="query"
      :label="question.title"
      :placeholder="config.placeholder"
      :button-text="config.buttonText"
      :aria-label="`${config.buttonText} pour ${question.title}`"
      :aria-controls="searchResultsId"
      :aria-activedescendant="activeDescendant"
      role="searchbox"
      autocomplete="off"
      @search="handleSearch"
    />

    <!-- Status announcer for screen readers -->
    <div
      aria-live="polite"
      class="sr-only"
      role="status"
    >
      {{ statusMessage }}
    </div>

    <!-- Results region -->
    <div
      :id="searchResultsId"
      aria-atomic="true"
    >
      <div
        v-if="debounceStatus === 'pending'"
        class="fr-mt-6w fr-mb-2w"
      >
        <LoadingSpinner :text="config.loadingText" />
      </div>

      <div
        v-else-if="debounceStatus === 'error'"
        class="fr-mt-3w"
        aria-live="assertive"
      >
        <DsfrAlert
          :id="`error-${question.id}`"
          type="error"
          :title="config.errorTitle"
          :description="config.errorDescription"
        />
      </div>

      <div
        v-else-if="debounceStatus === 'success' && selectOptions.length > 0"
        :id="optionsContainerId"
        ref="selectElement"
        class="fr-mt-3w"
        role="listbox"
        tabindex="-1"
      >
        <DsfrSelect
          :id="selectId"
          v-model="model"
          :options="selectOptions"
          :label="config.selectLabel"
          :hint="typeof config.selectHint === 'function' ? config.selectHint(lastSentQuery) : config.selectHint"
          :default-unselected-text="config.defaultUnselectedText"
          aria-required="false"
          @update:model-value="handleOptionSelect"
          @focus-option="handleOptionFocus"
        />
      </div>

      <div
        v-else-if="debounceStatus === 'success' && selectOptions.length === 0 && lastSentQuery"
        ref="noResultsAlert"
        class="fr-mt-3w"
        aria-live="polite"
      >
        <DsfrAlert
          :id="`no-results-${question.id}`"
          type="info"
          :description="config.noResultsText"
        />
      </div>
      <template
        v-if="debounceStatus === 'idle' && model"
      >
        <div
          class="fr-mt-3w"
        >
          <DsfrInput
            aria-hidden
            type="text"
            label="Sélection actuelle"
            label-visible
            :model-value="selectedValue"
            disabled
          />
          <p class="fr-sr-only">
            Votre sélection actuelle est : {{ selectedValue }}
          </p>
        </div>
      </template>
      <div
        v-if="(
          debounceStatus === 'error'
          || (debounceStatus === 'idle' && model)
          || (debounceStatus === 'success' && model && lastSentQuery)
        )"
      >
        <DsfrButton
          :label="config.resetButtonLabel"
          class="fr-mt-2w"
          size="sm"
          secondary
          icon="fr-icon-close-line"
          icon-right
          :aria-label="`${config.resetButtonLabel} la recherche`"
          @click="clearInput"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fr-spin-anim {
  display: inline-block;
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

.sr-only,
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
