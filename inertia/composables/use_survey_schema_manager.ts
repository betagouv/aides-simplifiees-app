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
  onNewSchema?: (simulateurId?: string) => void
} = {}) {
  /**
   * State
   */
  const schemas = ref<{ [simulateurId: string]: SurveyNormalizedSchema | null }>({})
  const schemaStatus = ref<{ [simulateurId: string]: 'idle' | 'pending' | 'error' | 'success' }>({})
  const versions = ref<{ [simulateurId: string]: string }>({})

  /**
   * Composables
   */
  const { debug } = useSurveyDebugStore()

  /**
   * Methods
   */

  const getVersion = (simulateurId: string): string => {
    const version = versions.value[simulateurId]
    debug.log(`[Surveys store][${simulateurId}] Version:`, version)
    return version
  }

  const setVersion = (simulateurId: string, version: string) => {
    versions.value[simulateurId] = version
    debug.log(`[Surveys store][${simulateurId}] Version set to:`, version)
  }

  const getSchemaStatus = (simulateurId: string): 'idle' | 'pending' | 'error' | 'success' => {
    return schemaStatus.value[simulateurId] || 'idle'
  }

  function setSchemaStatus(
    simulateurId: string,
    status: 'idle' | 'pending' | 'error' | 'success',
  ) {
    if (status === 'error') {
      console.error(`[Surveys store][${simulateurId}] Error loading survey schema`)
    }
    else {
      debug.log(`[Surveys store][${simulateurId}] Schema status:`, status)
    }
    schemaStatus.value[simulateurId] = status
  }

  const getSchema = (simulateurId: string): SurveyNormalizedSchema | null => {
    return schemas.value[simulateurId] || null
  }

  const setSchema = (simulateurId: string, schema: SurveyNormalizedSchema) => {
    // Normalize schema before setting it
    const normalizedSchema = normalizeSchema(schema)
    schemas.value[simulateurId] = normalizedSchema
    debug.log(`[Surveys store][${simulateurId}] Schema set:`, normalizedSchema)
  }

  /**
   * Normalize schema to use the page-based format
   * This converts legacy format (steps with direct questions) to the new format (steps with pages)
   */
  function normalizeSchema(schema: SurveySchema): SurveyNormalizedSchema {
    const normalizedSchema = { ...schema }

    // Convert each step to use the page-based format if needed
    normalizedSchema.steps = schema.steps.map((step) => {
      // If the step already uses pages, return as is
      if (step.pages && step.pages.length > 0) {
        return step
      }

      // Convert legacy format (direct questions) to page-based format
      // Create one page per question
      if (step.questions && step.questions.length > 0) {
        const normalizedStep = { ...step }
        normalizedStep.pages = step.questions.map((question: SurveyQuestion, index: number) => {
          return {
            id: `${step.id}_page_${index + 1}`,
            // title: question.title,
            questions: [question],
          }
        })

        return normalizedStep
      }

      return step
    })

    return normalizedSchema
  }

  async function loadSchema(simulateurId: string) {
    debug.log(`[Surveys store][${simulateurId}] Loading survey schema...`)

    const {
      data: schema,
      isFetching,
      isFinished,
      error: loadingError,
    } = useFetch<SurveySchema>(`/forms/${simulateurId}.json`).get().json()

    watch(
      [isFinished, isFetching, loadingError],
      () => {
        if (loadingError.value) {
          setSchemaStatus(simulateurId, 'error')
        }
        else if (isFinished.value) {
          setSchemaStatus(simulateurId, 'success')
        }
        else if (isFetching.value) {
          setSchemaStatus(simulateurId, 'pending')
        }
      },
      { immediate: true },
    )

    watch(schema, (newSchema: SurveySchema) => {
      if (newSchema) {
        try {
          if (newSchema.forceRefresh) {
            debug.warn(`[Surveys store][${simulateurId}] Schema forceRefresh is true, resetting survey...`)
            setVersion(simulateurId, newSchema.version)
            setSchema(simulateurId, newSchema)
            onNewSchema?.(simulateurId)
          }
          else {
            const storedVersion = getVersion(simulateurId)
            if (!storedVersion) {
              debug.log(`[Surveys store][${simulateurId}] No stored version found, assuming first load`)
              setVersion(simulateurId, newSchema.version)
              setSchema(simulateurId, newSchema)
              onNewSchema?.(simulateurId)
            }
            else if (compareVersions(newSchema.version, storedVersion) > 0) {
              debug.warn(`[Surveys store][${simulateurId}] Schema version changed !`)
              setVersion(simulateurId, newSchema.version)
              setSchema(simulateurId, newSchema)
              onNewSchema?.(simulateurId)
            }
            else {
              debug.log(
                `[Surveys store][${simulateurId}] Schema version unchanged, no need to reset survey`,
              )
              setSchema(simulateurId, newSchema)
            }
          }
        }
        catch (error) {
          console.error(`[Surveys store][${simulateurId}] Error updating schema:`, error)
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
