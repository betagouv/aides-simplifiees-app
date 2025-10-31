import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import FormSubmission from '#models/form_submission'
import { Exception } from '@adonisjs/core/exceptions'
import logger from '@adonisjs/core/services/logger'
import axios from 'axios'

export default class DemarchesSimplifiedController {
  /**
   * Create a prefilled dossier on Démarches Simplifiées
   * 
   * This endpoint:
   * 1. Retrieves the form submission answers using the hash
   * 2. Maps the answers to DS fields based on aide configuration
   * 3. Makes a POST request to DS API
   * 4. Returns the prefilled dossier URL
   */
  public async createPrefilledDossier({ request, response }: HttpContext) {
    try {
      const { aideSlug, submissionHash } = request.only(['aideSlug', 'submissionHash'])

      if (!aideSlug || !submissionHash) {
        return response.status(400).json({
          success: false,
          error: 'Missing required fields: aideSlug and submissionHash',
        })
      }

      // Get the aide with DS configuration
      const aide = await Aide.query()
        .where('slug', aideSlug)
        .whereIn('status', ['published', 'unlisted'])
        .first()

      if (!aide) {
        throw new Exception('Aide not found', { status: 404, code: 'NOT_FOUND' })
      }

      // Check if DS integration is enabled
      if (!aide.dsEnabled || !aide.dsDemarcheId || !aide.dsFieldMapping) {
        return response.status(400).json({
          success: false,
          error: 'Démarches Simplifiées integration is not configured for this aide',
        })
      }

      // Get the form submission
      const submission = await FormSubmission.query()
        .where('secure_hash', submissionHash)
        .first()

      if (!submission) {
        throw new Exception('Form submission not found', { status: 404, code: 'NOT_FOUND' })
      }

      // Map the answers to DS fields
      const dsPayload: Record<string, any> = {}
      const answers = submission.answers as Record<string, any>

      for (const [dsFieldKey, questionId] of Object.entries(aide.dsFieldMapping)) {
        if (answers[questionId] !== undefined) {
          let value = answers[questionId]
          
          // Handle combobox answers (stored as JSON string)
          if (typeof value === 'string' && value.startsWith('{')) {
            try {
              const parsed = JSON.parse(value)
              value = parsed.value || parsed.text || value
            }
            catch {
              // If parsing fails, use the value as is
            }
          }
          
          dsPayload[dsFieldKey] = value
        }
      }

      logger.info('Creating prefilled DS dossier', {
        aideSlug,
        demarcheId: aide.dsDemarcheId,
        mappedFields: Object.keys(dsPayload).length,
      })

      // Make the request to Démarches Simplifiées API
      const dsUrl = `https://www.demarches-simplifiees.fr/api/public/v1/demarches/${aide.dsDemarcheId}/dossiers`
      
      try {
        const dsResponse = await axios.post(
          dsUrl,
          dsPayload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )

        logger.info('DS dossier created successfully', {
          aideSlug,
          dossierNumber: dsResponse.data.dossier_number,
        })

        return response.status(200).json({
          success: true,
          dossierUrl: dsResponse.data.dossier_url,
          dossierId: dsResponse.data.dossier_id,
          dossierNumber: dsResponse.data.dossier_number,
        })
      }
      catch (dsError: any) {
        logger.error('Error calling Démarches Simplifiées API', {
          error: dsError.message,
          response: dsError.response?.data,
          status: dsError.response?.status,
        })

        return response.status(500).json({
          success: false,
          error: 'Failed to create dossier on Démarches Simplifiées',
          details: dsError.response?.data || dsError.message,
        })
      }
    }
    catch (error: any) {
      logger.error('Error in createPrefilledDossier', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      })
    }
  }
}

