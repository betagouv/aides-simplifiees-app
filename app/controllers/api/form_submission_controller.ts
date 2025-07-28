/* eslint-disable perfectionist/sort-imports */
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import FormSubmission from '#models/form_submission'
import LoggingService from '#services/logging_service'

export default class FormSubmissionController {
  private loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService(logger)
  }

  /**
   * Store form submission data
   * Saves answers and results for a simulator and returns a secure URL for viewing results
   */
  public async store(ctx: HttpContext) {
    const { request, response } = ctx
    const timer = this.loggingService.startTimer('form_submission_store')

    try {
      // Get the JSON body from the request
      const { simulateurSlug, answers, results } = request.body()

      // Validate required fields
      if (!simulateurSlug) {
        this.loggingService.logWarning('Form submission missing simulateurSlug', ctx)
        return response.status(400).json({
          success: false,
          error: 'Missing required field: simulateurSlug',
        })
      }

      if (!answers) {
        this.loggingService.logWarning('Form submission missing answers', ctx, {
          simulateurSlug,
        })
        return response.status(400).json({
          success: false,
          error: 'Missing required field: answers',
        })
      }

      // Log the received data
      this.loggingService.logFormSubmission('simulator_form', ctx, {
        simulateurSlug,
        answersCount: Object.keys(answers).length,
        hasResults: !!results,
      })

      // Create a new FormSubmission record
      const submission = await FormSubmission.create({
        simulateurSlug,
        answers,
        results: results || {}, // Make results optional with default empty object
      })

      // Get the URL for viewing results
      const resultsUrl = submission.getResultsUrl()

      timer.stopWithMessage(`Form submission created successfully with ID ${submission.id}`)

      return response.status(200).json({
        success: true,
        message: 'Form data stored successfully',
        submissionId: submission.id,
        secureHash: submission.secureHash,
        resultsUrl,
      })
    }
    catch (error: any) {
      timer.stopWithMessage(`Form submission failed: ${error.message}`)

      this.loggingService.logError(error, ctx, {
        context: 'form_submission_store',
        simulateurSlug: request.body()?.simulateurSlug,
      })

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
  public async show(ctx: HttpContext) {
    const { params, response } = ctx
    const timer = this.loggingService.startTimer('form_submission_show', {
      hash: params.hash,
    })

    try {
      const { hash } = params

      if (!hash) {
        this.loggingService.logWarning('Form submission retrieval missing hash', ctx)
        return response.status(400).json({
          success: false,
          error: 'Missing required parameter: hash',
        })
      }

      const submission = await FormSubmission.query()
        .where('secureHash', hash)
        .first()

      if (!submission) {
        this.loggingService.logWarning('Form submission not found', ctx, {
          hash,
        })
        return response.status(404).json({
          success: false,
          error: 'Form submission not found',
        })
      }

      timer.stopWithMessage(`Form submission retrieved successfully for hash ${hash}`)

      this.loggingService.logBusinessEvent('form_submission_retrieved', {
        submissionId: submission.id,
        simulateurSlug: submission.simulateurSlug,
        hash,
      })

      return response.status(200).json({
        success: true,
        submission: {
          id: submission.id,
          simulateurSlug: submission.simulateurSlug,
          answers: submission.answers,
          results: submission.results,
          createdAt: submission.createdAt,
        },
      })
    }
    catch (error: any) {
      timer.stopWithMessage(`Form submission retrieval failed: ${error.message}`)

      this.loggingService.logError(error, ctx, {
        context: 'form_submission_show',
        hash: params.hash,
      })

      return response.status(500).json({
        success: false,
        error: 'Failed to retrieve form submission',
        details: error.message,
      })
    }
  }
}
