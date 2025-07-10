import { useFetch } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useSurveyDebugStore } from '~/stores/survey_debug'
import { compareVersions } from '~/utils/compare_versions'

/**
 * A composable to manage the survey schema
 * It loads the schema from the server and normalizes it
 * It also manages the schema status (idle, pending, error, success)
 * and the schema version.
 */
export function useSurveySchemaManager({
  onNewSchema,
}: {
  onNewSchema?: (simulateurSlug?: string) => void
} = {}) {
  /**
   * State
   */
  const schemas = ref<{ [simulateurSlug: string]: SurveyNormalizedSchema | null }>({})
  const schemaStatus = ref<{ [simulateurSlug: string]: 'idle' | 'pending' | 'error' | 'success' }>({})
  const versions = ref<{ [simulateurSlug: string]: string }>({})

  /**
   * Composables
   */
  const { debug } = useSurveyDebugStore()

  /**
   * Methods
   */

  const getVersion = (simulateurSlug: string): string => {
    const version = versions.value[simulateurSlug]
    debug.log(`[Surveys store][${simulateurSlug}] Version:`, version)
    return version
  }

  const setVersion = (simulateurSlug: string, version: string) => {
    versions.value[simulateurSlug] = version
    debug.log(`[Surveys store][${simulateurSlug}] Version set to:`, version)
  }

  const getSchemaStatus = (simulateurSlug: string): 'idle' | 'pending' | 'error' | 'success' => {
    return schemaStatus.value[simulateurSlug] || 'idle'
  }

  function setSchemaStatus(
    simulateurSlug: string,
    status: 'idle' | 'pending' | 'error' | 'success',
  ) {
    if (status === 'error') {
      console.error(`[Surveys store][${simulateurSlug}] Error loading survey schema`)
    }
    else {
      debug.log(`[Surveys store][${simulateurSlug}] Schema status:`, status)
    }
    schemaStatus.value[simulateurSlug] = status
  }

  const getSchema = (simulateurSlug: string): SurveyNormalizedSchema | null => {
    return schemas.value[simulateurSlug] || null
  }

  const setSchema = (simulateurSlug: string, schema: SurveySchema) => {
    // Normalize schema before setting it
    const normalizedSchema = normalizeSchema(schema)
    validateSchema(normalizedSchema)
    schemas.value[simulateurSlug] = normalizedSchema
    debug.log(`[Surveys store][${simulateurSlug}] Schema set:`, normalizedSchema)
  }

  /**
   * Normalize schema to use the page-based format
   * This converts legacy format (steps with direct questions) to the new format (steps with pages)
   */
  function normalizeSchema(schema: SurveySchema): SurveyNormalizedSchema {
    // Convert each step to use the page-based format if needed
    const normalizedSteps: SurveyDeepStep[] = schema.steps.map((step) => {
      // If the step already uses pages, return as is
      if ('pages' in step && step.pages && step.pages.length > 0) {
        return step as SurveyDeepStep
      }

      // Convert legacy format (direct questions) to page-based format
      // Create one page per question
      if ('questions' in step && step.questions && step.questions.length > 0) {
        const normalizedStep: SurveyDeepStep = {
          id: step.id,
          title: step.title,
          pages: step.questions.map((question: SurveyQuestionData, index: number) => {
            return {
              id: `${step.id}_page_${index + 1}`,
              // title: question.title,
              questions: [question],
            }
          }),
        }

        return normalizedStep
      }

      // If step has neither pages nor questions, create empty step
      return {
        id: step.id,
        title: step.title,
        pages: [],
      }
    })

    // Create normalized schema with proper typing
    if (schema.engine === 'openfisca') {
      return {
        ...schema,
        steps: normalizedSteps,
      } as OpenFiscaNormalizedSchema
    }
    else {
      return {
        ...schema,
        steps: normalizedSteps,
      } as PublicodesNormalizedSchema
    }
  }

  function validateSchema(schema: SurveyNormalizedSchema) {
    if (!schema.id) {
      throw new Error('Schema must have an id')
    }
    if (!schema.version) {
      throw new Error('Schema must have a version')
    }
    // if (!schema.steps || schema.steps.length === 0) {
    //   throw new Error('Schema must have at least one step')
    // }

    // Validate each step
    schema.steps.forEach((step) => {
      if (!step.id) {
        console.warn(`Step must have an id: ${JSON.stringify(step)}`)
      }
      if (!step.title) {
        console.warn(`Step must have a title: ${JSON.stringify(step)}`)
      }
      // Additional validation can be added here based on question type
    })
  }

  async function loadSchema(simulateurSlug: string) {
    debug.log(`[Surveys store][${simulateurSlug}] Loading survey schema...`)

    const {
      data: schema,
      isFetching,
      isFinished,
      error: loadingError,
    } = useFetch<SurveySchema>(`/forms/${simulateurSlug}.json`).get().json()

    watch(
      [isFinished, isFetching, loadingError],
      () => {
        if (loadingError.value) {
          setSchemaStatus(simulateurSlug, 'error')
        }
        else if (isFinished.value) {
          setSchemaStatus(simulateurSlug, 'success')
        }
        else if (isFetching.value) {
          setSchemaStatus(simulateurSlug, 'pending')
        }
      },
      { immediate: true },
    )

    watch(schema, (newSchema: SurveySchema) => {
      if (newSchema) {
        try {
          if (newSchema.forceRefresh) {
            debug.warn(`[Surveys store][${simulateurSlug}] Schema forceRefresh is true, resetting survey...`)
            setVersion(simulateurSlug, newSchema.version)
            setSchema(simulateurSlug, newSchema)
            onNewSchema?.(simulateurSlug)
          }
          else {
            const storedVersion = getVersion(simulateurSlug)
            if (!storedVersion) {
              debug.log(`[Surveys store][${simulateurSlug}] No stored version found, assuming first load`)
              setVersion(simulateurSlug, newSchema.version)
              setSchema(simulateurSlug, newSchema)
              onNewSchema?.(simulateurSlug)
            }
            else if (compareVersions(newSchema.version, storedVersion) > 0) {
              debug.warn(`[Surveys store][${simulateurSlug}] Schema version changed !`)
              setVersion(simulateurSlug, newSchema.version)
              setSchema(simulateurSlug, newSchema)
              onNewSchema?.(simulateurSlug)
            }
            else {
              debug.log(
                `[Surveys store][${simulateurSlug}] Schema version unchanged, no need to reset survey`,
              )
              setSchema(simulateurSlug, newSchema)
            }
          }
        }
        catch (error) {
          console.error(`[Surveys store][${simulateurSlug}] Error updating schema:`, error)
        }
      }
    })
  }

  return {
    schemas,
    schemaStatus,
    versions,
    loadSchema,
    setSchema,
    getSchema,
    normalizeSchema,
    getSchemaStatus,
    setSchemaStatus,
    getVersion,
    setVersion,
  }
}
