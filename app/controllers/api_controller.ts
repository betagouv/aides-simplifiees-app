import { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import matomoConfig from '#config/matomo'
import { dd } from '@adonisjs/core/services/dumper'

// Configuration constants
const WEEKS_TO_FETCH = 4

// Get simulator titles from the config
const SIMULATOR_TITLES = matomoConfig.simulatorTitles as Record<string, string>

interface SimulatorStats {
  title: string
  starts: number
  completions: number
  eligibilities: number
  weeklyStats: Array<{
    week: string
    completions: number
    eligibilities: number
    starts: number
  }>
  integrators: string[]
}

export default class ApiController {
  public async statistics({ response }: HttpContext) {
    try {
      // Check if config exists and has the matomo property
      if (!matomoConfig?.url || !matomoConfig?.token || !matomoConfig?.siteId) {
        console.error('Missing Matomo configuration')
        response.status(500).json({ error: 'Missing Matomo configuration' })
        return
      }

      // Get Matomo configuration from the config file
      const MATOMO_URL = matomoConfig.url
      const MATOMO_TOKEN = matomoConfig.token
      const MATOMO_SITE_ID = matomoConfig.siteId

      // Get events for the last WEEKS_TO_FETCH weeks
      const endDate = new Date()

      // Find the most recent completed Sunday (end of last complete week)
      const lastSunday = new Date(endDate)
      const dayOfWeek = lastSunday.getDay() // 0 is Sunday, 1 is Monday, etc.

      // If today is Sunday, we use the previous Sunday as our last complete week
      const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek
      lastSunday.setDate(lastSunday.getDate() - daysToSubtract)
      // Set to end of day (23:59:59)
      lastSunday.setHours(23, 59, 59, 999)

      const url = `${MATOMO_URL}/index.php`
      const statistics: Record<string, SimulatorStats> = {}

      // Store all week dates we need to display (for filling in empty weeks later)
      const allWeekEnds: string[] = []
      for (let i = 0; i < WEEKS_TO_FETCH; i++) {
        const weekEnd = new Date(lastSunday)
        weekEnd.setDate(lastSunday.getDate() - (7 * i))
        allWeekEnds.push(weekEnd.toISOString().split('T')[0])
      }

      // Add retry logic for API calls
      async function fetchWithRetry (params: any, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.error(url)
            console.error('------------------', {
              ...params,
              token_auth: MATOMO_TOKEN,
            })
            const response = await axios.post(url, {
              ...params,
              token_auth: MATOMO_TOKEN
            }, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              transformRequest: [(data) => {
                return Object.keys(data)
                  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                  .join('&')
              }],
              validateStatus (status) {
                return status < 500
              },
              timeout: 5000 // Increased timeout to 5 seconds
            })

            return response
          }
          catch (error: any) {
            if (attempt === maxRetries) {
              throw error
            }
            console.warn(`Attempt ${attempt} failed, retrying...`, error.message)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
        throw new Error('All retry attempts failed')
      }

      // Fetch data for each of the last WEEKS_TO_FETCH completed weeks
      for (let i = 0; i < WEEKS_TO_FETCH; i++) {
        // Add delay between requests (except for the first one)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }

        // Calculate week dates (Monday to Sunday)
        const weekEnd = new Date(lastSunday)
        weekEnd.setDate(lastSunday.getDate() - 7 * i)

        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekEnd.getDate() - 6) // Go back 6 days from Sunday to get Monday
        // Set to start of day (00:00:00)
        weekStart.setHours(0, 0, 0, 0)

        const weekParams = {
          module: 'API',
          method: 'Events.getAction',
          idSite: MATOMO_SITE_ID,
          period: 'range',
          date: `${weekStart.toISOString().split('T')[0]},${weekEnd.toISOString().split('T')[0]}`,
          format: 'JSON',
          expanded: 1,
          flat: 1,
          secondaryDimension: 'eventName',
        }

        try {
          const actionsResponse = await fetchWithRetry(weekParams)

          if (!actionsResponse || actionsResponse.status !== 200) {
            console.error('Matomo API error:', actionsResponse?.status)
            continue
          }

          const weekKey = weekEnd.toISOString().split('T')[0]
          const actionsData = actionsResponse.data

          if (!Array.isArray(actionsData)) {
            console.error('Invalid response format for week:', i + 1)
            continue
          }

          // Process each action in the week
          for (const action of actionsData) {
            // First check if it's a standard format event
            let isSubmit = false
            let isStart = false
            let isEligibility = false

            if (action.Events_EventAction) {
              isSubmit = action.Events_EventAction === 'Submit'
              isStart = action.Events_EventAction === 'Start'
              isEligibility = action.Events_EventAction === 'Eligibility'
            }

            // Skip if not a relevant event type
            if (!isSubmit && !isStart && !isEligibility) {
              continue
            }

            // For legacy formats, extract simulator ID and source from label
            let simulatorId: string | null = null
            let source: string | null = null
            const eventName = action.Events_EventName

            if (eventName) {
              // Process standard format
              const matches = eventName.match(/\[(.*?)\]\[(.*?)\]/)
              if (matches) {
                ;[, simulatorId, source] = matches
              } else {
                simulatorId = eventName
                source = 'website'
              }
            }

            // Skip if we couldn't extract simulator ID or it's not in our list
            if (!simulatorId || !SIMULATOR_TITLES[simulatorId]) {
              continue
            }

            // Initialize statistics for this simulator if not exists
            if (!statistics[simulatorId]) {
              statistics[simulatorId] = {
                title: SIMULATOR_TITLES[simulatorId],
                starts: 0,
                completions: 0,
                eligibilities: 0,
                weeklyStats: [],
                integrators: [],
              }
            }

            // Add source to integrators if not already present
            if (source && !statistics[simulatorId].integrators.includes(source)) {
              statistics[simulatorId].integrators.push(source)
            }

            // Update global stats based on the event type
            console.warn(action)
            if (isStart) {
              statistics[simulatorId].starts += action.nb_events || 1
            }
            else if (isSubmit) {
              statistics[simulatorId].completions += action.nb_events || 1
            }
            else if (isEligibility) {
              statistics[simulatorId].eligibilities += action.nb_visits || 1
            }

            // Update weekly stats
            let weekStat = statistics[simulatorId].weeklyStats.find(w => w.week === weekKey)
            if (!weekStat) {
              weekStat = { week: weekKey, completions: 0, eligibilities: 0, starts: 0 }
              statistics[simulatorId].weeklyStats.push(weekStat)
            }

            if (isStart) {
              weekStat.starts = (weekStat.starts || 0) + (action.nb_events || 1)
            }
            else if (isSubmit) {
              weekStat.completions += action.nb_events || 1
            }
            else if (isEligibility) {
              weekStat.eligibilities += action.nb_visits || 1
            }
          }
        } catch (error: any) {
          console.error(`Error fetching data for week ${i + 1}:`, error)
        }
      }

      // Sort weekly stats by date
      for (const simulatorId in statistics) {
        statistics[simulatorId].weeklyStats.sort((a, b) => a.week.localeCompare(b.week))

        // Fill in any missing weeks with zero data
        const existingWeeks = new Set(statistics[simulatorId].weeklyStats.map((w) => w.week))

        // Add any missing weeks with zero values
        for (const weekEnd of allWeekEnds) {
          if (!existingWeeks.has(weekEnd)) {
            statistics[simulatorId].weeklyStats.push({
              week: weekEnd,
              completions: 0,
              eligibilities: 0,
              starts: 0,
            })
          }
        }

        // Sort again to ensure correct order after adding missing weeks
        statistics[simulatorId].weeklyStats.sort((a, b) => a.week.localeCompare(b.week))
      }

      // Set proper content type and return the data
      response.header('Content-Type', 'application/json')
      return {
        statistics,
        satisfaction: {
          yes: 57,
          partial: 30,
          no: 13,
        },
      }
    } catch (error: any) {
      console.error('Error in statistics endpoint:', error)
      return response.status(500).json({
        error: 'Failed to fetch statistics',
        details: error.message,
      })
    }
  }
}
