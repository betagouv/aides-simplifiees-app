import type { HttpContext } from '@adonisjs/core/http'
import FormSubmission from '#models/form_submission'

export default class FormSubmissionController {
  /**
   * Store form submission data
   * Saves answers and results for a simulator and returns a secure URL for viewing results
   */
  public async store({ request, response }: HttpContext) {
    try {
      // Get the JSON body from the request
      const { simulateurId, answers, results } = request.body()

      // Validate required fields
      if (!simulateurId) {
        return response.status(400).json({
          success: false,
          error: 'Missing required field: simulateurId',
        })
      }

      if (!answers) {
        return response.status(400).json({
          success: false,
          error: 'Missing required field: answers',
        })
      }

      // Log the received data
      console.log(`[API] Storing form data for simulator: ${simulateurId}`)

      // Create a new FormSubmission record
      const submission = await FormSubmission.create({
        simulatorId: simulateurId,
        answers,
        results: results || {}, // Make results optional with default empty object
      })

      // Get the URL for viewing results
      const resultsUrl = submission.getResultsUrl()

      return response.status(200).json({
        success: true,
        message: 'Form data stored successfully',
        submissionId: submission.id,
        secureHash: submission.secureHash,
        resultsUrl,
      })
    }
    catch (error: any) {
      console.error('Error storing form data:', error)

      return response.status(500).json({
        success: false,
        error: 'Failed to store form data',
        details: error.message,
      })
    }
  }

  /**
   * Retrieve a form submission by secure hash
   */
  public async show({ params, response }: HttpContext) {
    try {
      const { hash } = params

      if (!hash) {
        return response.status(400).json({
          success: false,
          error: 'Missing required parameter: hash',
        })
      }

      const submission = await FormSubmission.query()
        .where('secureHash', hash)
        .first()

      if (!submission) {
        return response.status(404).json({
          success: false,
          error: 'Form submission not found',
        })
      }

      return response.status(200).json({
        success: true,
        submission: {
          id: submission.id,
          simulatorId: submission.simulatorId,
          answers: submission.answers,
          results: submission.results,
          createdAt: submission.createdAt,
        },
      })
    }
    catch (error: any) {
      console.error('Error retrieving form submission:', error)

      return response.status(500).json({
        success: false,
        error: 'Failed to retrieve form submission',
        details: error.message,
      })
    }
  }
}
