<script lang="ts" setup>
import type { AutocompleteFn } from '~/utils/autocomplete_functions'
import { DsfrAlert, DsfrButton, DsfrInput } from '@gouvminint/vue-dsfr'
import { useAsyncState, useDebounceFn } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  question: SurveyQuestionData
  autocompleteFn: AutocompleteFn
  autocompleteConfig?: SurveyQuestionAutocompleteConfig
}>(), {
  autocompleteConfig: () => ({}),
})

const defaultConfig = {
  placeholder: 'Rechercher et sélectionner une option',
  loadingText: 'Chargement des suggestions...',
  noResultsText: 'Aucun résultat trouvé pour votre recherche',
  errorTitle: 'Erreur lors de la recherche',
  errorDescription: 'Veuillez réessayer plus tard.',
  minSearchLength: 2,
}

const config = {
  ...defaultConfig,
  ...(props.autocompleteConfig || {}),
}

const model = defineModel<string | undefined>()
const inputValue = ref<string>('') // The visible input value
const lastQuery = ref<string>('') // Last query sent to API
const datalistId = `datalist-${props.question.id}`
const inputId = `input-${props.question.id}`
const isInitializing = ref<boolean>(true) // Flag to prevent API calls during initialization

// Reference to the input element
const searchElement = ref<HTMLElement | null>(null)

const { state: selectOptions, isLoading, error, execute: searchOptions } = useAsyncState(
  () => props.autocompleteFn(lastQuery.value),
  [], // initial state
  { immediate: false },
)

const statusMessage = ref<string>('')

// Debounced search function
const debouncedSearch = useDebounceFn((query: string) => {
  if (
    query.trim().length >= config.minSearchLength
  ) {
    lastQuery.value = query.trim()
    searchOptions()
  }
}, 300)

// Watch input changes and trigger debounced search
watch(inputValue, (newValue) => {
  // Don't trigger API calls during initialization
  if (isInitializing.value) {
    return
  }

  if (newValue.trim().length >= config.minSearchLength) {
    // Check if the new value matches any existing option to avoid redundant API calls
    const isExistingOption = selectOptions.value.some((opt) => {
      if (!opt) {
        return false
      }

      // Handle simple string/number options
      if (typeof opt === 'string' || typeof opt === 'number') {
        return opt.toString() === newValue.trim()
      }

      // Handle object options with value and text properties
      if (typeof opt === 'object' && 'value' in opt && 'text' in opt) {
        return opt.text === newValue.trim() || opt.value?.toString() === newValue.trim()
      }

      return false
    })

    // Only search if it's not an existing option
    if (!isExistingOption) {
      debouncedSearch(newValue)
    }
  }
  else if (newValue.trim().length === 0) {
    // Clear results when input is empty
    lastQuery.value = ''
    selectOptions.value = []
  }
})

// Handle selection from datalist
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  // Check if the value matches one of the options exactly
  const matchedOption = selectOptions.value.find((opt) => {
    if (!opt) {
      return false
    }

    // Handle simple string/number options
    if (typeof opt === 'string' || typeof opt === 'number') {
      return opt.toString() === value
    }

    // Handle object options with value and text properties
    if (typeof opt === 'object' && 'value' in opt && 'text' in opt) {
      return opt.text === value || opt.value?.toString() === value
    }

    return false
  })

  if (matchedOption) {
    // User selected an option from the datalist
    model.value = JSON.stringify(matchedOption)
    const displayText = typeof matchedOption === 'object' && 'text' in matchedOption
      ? matchedOption.text
      : matchedOption?.toString()
    statusMessage.value = `Option "${displayText}" sélectionnée`
  }
  else {
    // User is typing or selected something not in the list
    model.value = undefined
  }
}

function handleSearchClick() {
  if (inputValue.value.trim().length >= config.minSearchLength) {
    lastQuery.value = inputValue.value.trim()
    searchOptions()

    // Force the input to show the datalist by triggering focus and input events
    nextTick(() => {
      const input = searchElement.value?.querySelector?.('input')
      if (input) {
        input.focus()
        // Trigger the datalist to show by simulating user interaction
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('click', { bubbles: true }))
      }
    })
  }
}

// Watch for changes in loading/error states
watch([isLoading, error], () => {
  if (isLoading.value) {
    statusMessage.value = config.loadingText
  }
  else if (error.value) {
    statusMessage.value = `${config.errorTitle}. ${config.errorDescription}`
  }
  else if (selectOptions.value.length > 0) {
    statusMessage.value = `${selectOptions.value.length} options trouvées`
    // Try to show the datalist when options are loaded
    nextTick(() => {
      const input = searchElement.value?.querySelector?.('input')
      if (input && document.activeElement === input) {
        // Only trigger if the input is focused
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
  }
  else if (lastQuery.value && selectOptions.value.length === 0) {
    statusMessage.value = config.noResultsText
  }
})

// Initialize input value if model already has a value
watch(model, (newValue) => {
  if (newValue && !inputValue.value) {
    try {
      const parsed = JSON.parse(newValue)
      inputValue.value = parsed.text || parsed.value
    }
    catch {
      // Handle invalid JSON
    }
  }
}, { immediate: true })

// Set initialization flag to false after component is mounted
nextTick(() => {
  isInitializing.value = false
})
</script>

<template>
  <div class="combobox-wrapper">
    <!-- Main input with native datalist -->
    <div
      ref="searchElement"

      class="fr-search-bar fr-search-bar--lg"
      role="search"
    >
      <DsfrInput
        v-model="inputValue"
        :label="question.title"
        :placeholder="config.placeholder"
        :list="datalistId"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="selectOptions.length > 0"
        :aria-describedby="`${inputId}-status`"
        @input="handleInput"
        @keydown.enter="handleSearchClick"
      />
      <DsfrButton
        title="Rechercher"
        :aria-label="`Rechercher pour ${question.title}`"
        @click="handleSearchClick"
      >
        Rechercher
      </DsfrButton>
    </div>

    <!-- Native datalist for suggestions -->
    <datalist :id="datalistId">
      <option
        v-for="(option, index) in selectOptions"
        :key="typeof option === 'object' && option && 'value' in option ? option.value?.toString() || index : option?.toString() || index"
        :value="typeof option === 'object' && option && 'text' in option ? option.text : option?.toString() || ''"
        :label="typeof option === 'object' && option && 'text' in option ? option.text : option?.toString() || ''"
      />
    </datalist>

    <!-- Status announcer for screen readers -->
    <div
      :id="`${inputId}-status`"
      aria-live="polite"
      class="fr-sr-only"
      role="status"
    >
      {{ statusMessage }}
    </div>

    <!-- Error state -->
    <div
      v-if="error"
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

    <!-- No results message -->
    <div
      v-else-if="lastQuery && selectOptions.length === 0 && !isLoading"
      class="fr-mt-3w"
      aria-live="polite"
    >
      <DsfrAlert
        :id="`no-results-${question.id}`"
        type="info"
        :description="config.noResultsText"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.combobox-wrapper {
  position: relative;
}
</style>
