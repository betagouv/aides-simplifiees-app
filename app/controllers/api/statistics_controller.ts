import type { HttpContext } from '@adonisjs/core/http'
import matomoConfig from '#config/matomo'
import env from '#start/env'
import axios from 'axios'

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

export default class StatisticsController {
  public async getStatistics({ response }: HttpContext) {
    console.error('Fetching statistics...')
    try {
      // Check if config exists and has the matomo property
      if (!matomoConfig?.url || !matomoConfig?.token || !matomoConfig?.siteId) {
        console.error('Missing Matomo configuration')
        return response.status(500).json({ error: 'Missing Matomo configuration' })
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
      const allWeekEnds = await this.generateWeekEndDates(lastSunday)

      // Fetch data for each of the last WEEKS_TO_FETCH completed weeks
      for (let i = 0; i < WEEKS_TO_FETCH; i++) {
        // Add delay between requests (except for the first one)
        if (i > 0) {
          console.log(`Waiting before fetching week ${i + 1} data...`)
          // Use environment-based delay - 0ms in test, 2000ms in production
          const REQUEST_DELAY = env.get('NODE_ENV') === 'test' ? 0 : 2000
          if (REQUEST_DELAY > 0) {
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))
          }
          console.log(`Fetching week ${i + 1} data...`)
        }

        // Calculate week dates (Monday to Sunday)
        const { weekStart, weekEnd } = this.calculateWeekDates(lastSunday, i)
        const weekKey = weekEnd.toISOString().split('T')[0]

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
          const actionsResponse = await this.fetchWithRetry(url, weekParams, MATOMO_TOKEN)

          if (!actionsResponse || actionsResponse.status !== 200) {
            console.error('Matomo API error:', actionsResponse?.status)
            continue
          }

          const actionsData = actionsResponse.data

          if (!Array.isArray(actionsData)) {
            console.error('Invalid response format for week:', i + 1)
            continue
          }

          // Process each action in the week
          for (const action of actionsData) {
            this.processAction(action, statistics, weekKey)
          }
        }
        catch (error: any) {
          console.error(`Error fetching data for week ${i + 1}:`, error)
        }
      }

      // Sort weekly stats by date and fill in missing weeks
      this.processFinalStatistics(statistics, allWeekEnds)

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
    }
    catch (error: any) {
      console.error('Error in statistics endpoint:', error)
      return response.status(500).json({
        error: 'Failed to fetch statistics',
        details: error.message,
      })
    }
  }

  /**
   * Generate array of week end dates
   */
  private async generateWeekEndDates(lastSunday: Date): Promise<string[]> {
    const allWeekEnds: string[] = []
    for (let i = 0; i < WEEKS_TO_FETCH; i++) {
      const weekEnd = new Date(lastSunday)
      weekEnd.setDate(lastSunday.getDate() - 7 * i)
      allWeekEnds.push(weekEnd.toISOString().split('T')[0])
    }
    return allWeekEnds
  }

  /**
   * Calculate start and end of a week based on lastSunday and week index
   */
  private calculateWeekDates(lastSunday: Date, weekIndex: number): { weekStart: Date, weekEnd: Date } {
    const weekEnd = new Date(lastSunday)
    weekEnd.setDate(lastSunday.getDate() - 7 * weekIndex)

    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6) // Go back 6 days from Sunday to get Monday
    // Set to start of day (00:00:00)
    weekStart.setHours(0, 0, 0, 0)

    return { weekStart, weekEnd }
  }

  /**
   * Process a single action data point from Matomo
   */
  private processAction(
    action: any,
    statistics: Record<string, SimulatorStats>,
    weekKey: string,
  ): void {
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
      return
    }

    // For legacy formats, extract simulator ID and source from label
    let simulatorId: string | null = null
    let source: string | null = null
    const eventName = action.Events_EventName

    if (eventName) {
      // Process standard format
      const matches = eventName.match(/\[(.*?)\](?:\[(.*?)\]|(.*))/)
      if (matches) {
        simulatorId = matches[1]
        // Use the bracketed source if it exists, otherwise use the unbracketed source
        source = matches[2] || matches[3] || 'website'
      }
      else {
        simulatorId = eventName
        source = 'website'
      }
    }

    // Skip if we couldn't extract simulator ID or it's not in our list
    if (!simulatorId || !SIMULATOR_TITLES[simulatorId]) {
      return
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
    this.updateWeeklyStats(statistics[simulatorId], weekKey, isStart, isSubmit, isEligibility, action)
  }

  /**
   * Update weekly statistics for a specific simulator
   */
  private updateWeeklyStats(
    simulatorStats: SimulatorStats,
    weekKey: string,
    isStart: boolean,
    isSubmit: boolean,
    isEligibility: boolean,
    action: any,
  ): void {
    let weekStat = simulatorStats.weeklyStats.find(w => w.week === weekKey)
    if (!weekStat) {
      weekStat = { week: weekKey, completions: 0, eligibilities: 0, starts: 0 }
      simulatorStats.weeklyStats.push(weekStat)
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

  /**
   * Process final statistics: sort by date and fill in missing weeks
   */
  private processFinalStatistics(
    statistics: Record<string, SimulatorStats>,
    allWeekEnds: string[],
  ): void {
    for (const simulatorId in statistics) {
      statistics[simulatorId].weeklyStats.sort((a, b) => a.week.localeCompare(b.week))

      // Fill in any missing weeks with zero data
      const existingWeeks = new Set(statistics[simulatorId].weeklyStats.map(w => w.week))

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
  }

  /**
   * Fetch data with retry logic
   */
  private async fetchWithRetry(
    url: string,
    params: any,
    token: string,
    maxRetries = 3,
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await axios.post(
          url,
          {
            ...params,
            token_auth: token,
          },
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            transformRequest: [
              (data) => {
                return Object.keys(data)
                  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                  .join('&')
              },
            ],
            validateStatus(status) {
              return status < 500
            },
            timeout: 5000, // Increased timeout to 5 seconds
          },
        )
      }
      catch (error: any) {
        if (attempt === maxRetries) {
          throw error
        }
        console.warn(`Attempt ${attempt} failed, retrying...`, error.message)

        // Use environment-based retry delay - 0ms in test, 1000ms * attempt in production
        const RETRY_DELAY = env.get('NODE_ENV') === 'test' ? 0 : 1000 * attempt
        if (RETRY_DELAY > 0) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        }
      }
    }
    throw new Error('All retry attempts failed')
  }
}
