import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import axios from 'axios'

export default class GeoApiController {
  /**
   * Autocomplete communes based on query string
   * Uses external LexImpact service to get commune data
   */
  public async autocompleteCommunes({ request, response }: HttpContext) {
    // Get query parameter from the request
    const q = request.qs().q as string

    if (!q) {
      return response.status(200).json({ suggestions: [] })
    }

    // Get leximpact URL from environment
    const leximpactUrl = env.get('LEXIMPACT_URL')

    if (!leximpactUrl) {
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

      // Return the result
      return response.status(200).json(apiResponse.data)
    }
    catch (error: any) {
      console.error('Error fetching communes:', error)

      // Instead of failing silently, provide more information about the error
      if (error.response) {
        console.error('Error response status:', error.response.status)
        console.error('Error response data:', error.response.data)
      }

      // Still return empty results to avoid breaking the UI
      return response.status(200).json({
        suggestions: [],
        error: 'Failed to fetch commune data',
      })
    }
  }
}
