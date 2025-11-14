/* eslint-disable perfectionist/sort-imports */
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import logger from '@adonisjs/core/services/logger'
import LoggingService from '#services/logging_service'
import env from '#start/env'

export default class OpenFiscaController {
  private loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService(logger)
  }

  /**
   * Forwards a calculation request to the OpenFisca API
   * OpenFisca is a microsimulation engine for tax-benefit systems
   */
  public async calculate({ request, response }: HttpContext) {
    const timer = this.loggingService.startTimer('openfisca_calculation')

    try {
      // Get the JSON body from the request
      const requestBody = request.body()

      // Get OpenFisca API URL from environment
      const openFiscaUrl = env.get('OPENFISCA_URL')

      if (!openFiscaUrl) {
        this.loggingService.logError(new Error('Missing OpenFisca URL in environment'), undefined, {
          context: 'openfisca_calculation',
        })
        return response.status(500).json({ error: 'Missing OpenFisca URL in environment' })
      }

      // Make request to OpenFisca API
      const apiResponse = await axios.post(openFiscaUrl, requestBody, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout for calculations
      })
      console.log('OpenFisca API response received', apiResponse.data)

      // Log successful calculation
      this.loggingService.logExternalApiCall('openfisca', 'calculate', 'POST', {
        requestBodySize: JSON.stringify(requestBody).length,
        responseStatus: apiResponse.status,
        duration: timer.stop(),
      })

      // Return the result
      return response.status(200).json(apiResponse.data)
    }
    catch (error: any) {
      this.loggingService.logError(error, undefined, {
        context: 'openfisca_calculation',
        duration: timer.stop(),
      })

      // Check if it's an API error with a response
      if (error.response) {
        this.loggingService.logWarning('OpenFisca API error response', undefined, {
          context: 'openfisca_calculation',
          status: error.response.status,
          data: error.response.data,
        })

        return response.status(error.response.status || 500).json({
          error: error.response.status,
          message: error.response.data,
        })
      }

      // Generic error
      return response.status(500).json({
        error: 500,
        message: 'Internal Server Error',
      })
    }
  }
}
