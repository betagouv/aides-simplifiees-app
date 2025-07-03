/* eslint-disable perfectionist/sort-imports */
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import logger from '@adonisjs/core/services/logger'
import LoggingService from '#services/logging_service'
import env from '#start/env'

export default class GeoApiController {
  private loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService(logger)
  }

  /**
   * Autocomplete communes based on query string
   * Uses external LexImpact service to get commune data
   */
  public async autocompleteCommunes({ request, response }: HttpContext) {
    const timer = this.loggingService.startTimer('geo_api_autocomplete_communes')

    // Get query parameter from the request
    const q = request.qs().q as string

    if (!q) {
      this.loggingService.logExternalApiCall('leximpact', 'communes/autocomplete', 'GET', {
        query: '',
        resultCount: 0,
        duration: timer.stop(),
      })
      return response.status(200).json({ suggestions: [] })
    }

    // Get leximpact URL from environment
    const leximpactUrl = env.get('LEXIMPACT_URL')

    if (!leximpactUrl) {
      this.loggingService.logError(new Error('Missing LexImpact URL in environment'), undefined, {
        context: 'geo_api_autocomplete_communes',
        query: q,
      })
      return response.status(500).json({
        error: 'Missing LexImpact URL in environment',
      })
    }

    try {
      // Make request to leximpact service
      const apiResponse = await axios.get(
        `${leximpactUrl}/communes/autocomplete?q=${encodeURIComponent(q)}&field=commune&field=distributions_postales`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Client-ID': 'aides-simplifiees',
          },
          timeout: 5000, // 5 seconds timeout
        },
      )

      // Log successful API call
      this.loggingService.logExternalApiCall('leximpact', 'communes/autocomplete', 'GET', {
        query: q,
        resultCount: apiResponse.data?.suggestions?.length || 0,
        duration: timer.stop(),
      })

      // Return the result
      return response.status(200).json(apiResponse.data)
    }
    catch (error: any) {
      this.loggingService.logError(error, undefined, {
        context: 'geo_api_autocomplete_communes',
        query: q,
        duration: timer.stop(),
      })

      // Instead of failing silently, provide more information about the error
      if (error.response) {
        this.loggingService.logWarning('LexImpact API error response details', undefined, {
          context: 'geo_api_autocomplete_communes',
          status: error.response.status,
          data: error.response.data,
          query: q,
        })
      }

      // Still return empty results to avoid breaking the UI
      return response.status(200).json({
        suggestions: [],
        error: 'Failed to fetch commune data',
      })
    }
  }
}
