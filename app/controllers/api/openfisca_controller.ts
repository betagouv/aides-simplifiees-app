import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import axios from 'axios'

export default class OpenFiscaController {
  /**
   * Forwards a calculation request to the OpenFisca API
   * OpenFisca is a microsimulation engine for tax-benefit systems
   */
  public async calculate({ request, response }: HttpContext) {
    try {
      // Get the JSON body from the request
      const requestBody = request.body()

      // Get OpenFisca API URL from environment
      const openFiscaUrl = env.get('OPENFISCA_URL')

      if (!openFiscaUrl) {
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

      // Return the result
      return response.status(200).json(apiResponse.data)
    }
    catch (error: any) {
      console.error('Error in OpenFisca calculation API:', error)

      // Check if it's an API error with a response
      if (error.response) {
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
