import type { FormState } from '@publicodes/forms'
import type { RawPublicodes } from 'publicodes'
import { FormBuilder } from '@publicodes/forms'
import Engine from 'publicodes'
import { computed, ref } from 'vue'

export interface PublicodesFormConfig {
  rules: RawPublicodes<string>
  // Type kept as any: Publicodes situation values can be complex expressions
  // that don't map cleanly to SurveyAnswerValue
  initialSituation?: Record<string, any>
}

export function usePublicodesForm(config: PublicodesFormConfig) {
  // Non-reactive FormBuilder instance (stateless)
  const engine = new Engine(config.rules, {
    flag: {
      filterNotApplicablePossibilities: true,
      automaticNamespaceDisabling: false,
    },
  })
  const formBuilder = new FormBuilder({ engine })

  // Reactive state
  const formState = ref<FormState<string>>(FormBuilder.newState())
  try {
    formState.value = formBuilder.start(formState.value, 'resultat')
  }
  catch (e) {
    console.error('Error starting form:', e)
  }

  // Computed properties
  const currentPage = computed(() => {
    try {
      const page = formBuilder.currentPage(formState.value)
      return page.elements || []
    }
    catch (e) {
      console.error('Error getting current page:', e)
      return []
    }
  })

  const pagination = computed(() => {
    return formBuilder.pagination(formState.value)
  })

  const situation = computed(() => {
    return formState.value?.situation || {}
  })

  const result = computed(() => {
    // If there are next pages, don't show result yet
    if (formState.value.nextPages && formState.value.nextPages.length > 0) {
      return false
    }

    // Check if all required elements are answered or hidden
    if (
      !currentPage.value.every(
        element => !element.required || element.answered || element.hidden,
      )
    ) {
      return false
    }
    try {
      return (
        formBuilder
          .evaluate(formState.value, 'resultat')
          .nodeValue as string
      )
        .replaceAll('Non applicable', '')
    }
    catch (e) {
      console.error('Error evaluating result:', e)
      return null
    }
  })

  const handleInputChange = (
    id: string,
    value: string | number | boolean | undefined,
  ): void => {
    try {
      formState.value = formBuilder.handleInputChange(
        formState.value,
        id,
        value,
      )
    }
    catch (e) {
      console.error('Error handling input change:', e)
    }
  }

  const goToNextPage = (): void => {
    formState.value = formBuilder.goToNextPage(formState.value)
  }

  const goToPreviousPage = (): void => {
    formState.value = formBuilder.goToPreviousPage(formState.value)
  }

  // Type kept as any: Publicodes evaluation returns complex result types
  // that don't have proper TypeScript definitions
  const evaluate = (ruleName: string): any => {
    try {
      return formBuilder.evaluate(formState.value, ruleName)
    }
    catch (e) {
      console.error(`Error evaluating rule ${ruleName}:`, e)
      return null
    }
  }

  const reset = (): void => {
    try {
      let newState = FormBuilder.newState()
      newState = formBuilder.start(newState, 'resultat')
      formState.value = newState
    }
    catch (e) {
      console.error('Error resetting form:', e)
    }
  }

  return {
    // State
    formState,

    // Computed
    currentPage,
    pagination,
    situation,
    result,

    // Actions
    handleInputChange,
    goToNextPage,
    goToPreviousPage,
    evaluate,
    reset,
  }
}
