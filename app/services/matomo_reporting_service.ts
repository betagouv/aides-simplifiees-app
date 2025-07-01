import axios from 'axios'

interface MatomoConfig {
  url: string
  token: string
  siteId: string
}

interface MatomoEventData {
  Events_EventAction?: string
  Events_EventName?: string
  nb_events?: number
  nb_visits?: number
}

type ActionType = 'Start' | 'Submit' | 'Eligibility' | 'IntermediaryResults'

export interface TidyDataEntry {
  simulateurSlug: string
  periodKey: string // YYYY-MM-DD,YYYY-MM-DD format
  action: ActionType
  count: number
}

export interface TimePeriod {
  start: string // YYYY-MM-DD format
  end: string // YYYY-MM-DD format
}

export default class MatomoReportingService {
  private config: MatomoConfig
  private readonly requestTimeout = 5000

  get endpoint(): string {
    return `${this.config.url}/index.php`
  }

  constructor(config: MatomoConfig) {
    this.config = config
  }

  async fetchEventsCount(
    simulateurSlugs: string[],
    getPeriods: () => TimePeriod[],
  ): Promise<TidyDataEntry[]> {
    try {
      const actions: ActionType[] = ['Start', 'Submit', 'Eligibility']
      // const actions: ActionType[] = ['Start', 'Submit', 'Eligibility', 'IntermediaryResults']
      const periods = getPeriods()

      const urls = this.constructBulkUrls(actions, periods, simulateurSlugs)
      const bulkResults = await this.fetchBulk(urls)
      const results = this.processBulkResults(bulkResults, actions, periods, simulateurSlugs)

      return results
    }
    catch (error) {
      console.error('Failed to fetch Matomo event counts:', error)

      // Return empty results instead of throwing
      return []
    }
  }

  /**
   * Construct bulk API URLs for fetching event counts
   */
  private constructBulkUrls(actions: ActionType[], periods: TimePeriod[], simulateurSlugs: string[]): Record<string, string> {
    const urls: Record<string, string> = {}
    let index = 0

    for (const action of actions) {
      for (const simulateurSlug of simulateurSlugs) {
        for (const { start, end } of periods) {
          const baseParams = {
            method: 'Events.getAction',
            idSite: this.config.siteId,
            period: 'range',
            date: `${start},${end}`,
            format: 'JSON',
            expanded: '1',
            flat: '1',
            secondaryDimension: 'eventName',
            showMetadata: '0',
          }

          // Use filter_column and filter_pattern to efficiently filter at API level
          Object.assign(baseParams, {
            filter_pattern: `^${action} - \\[${simulateurSlug.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\]`,
            filter_column: 'label',
          })

          const requestParams = new URLSearchParams(baseParams)
          urls[`urls[${index}]`] = requestParams.toString()
          index++
        }
      }
    }

    return urls
  }

  /**
   * Fetch bulk data from Matomo API
   * Returns an array of results for each individual request
   */
  private async fetchBulk(urls: Record<string, string>): Promise<any[]> {
    const bulkParams = {
      module: 'API',
      method: 'API.getBulkRequest',
      format: 'json',
      token_auth: this.config.token,
      ...urls,
    }

    console.info(`Making bulk API request with ${Object.keys(urls).length} individual requests`)

    const response = await axios.post(this.endpoint, bulkParams, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      transformRequest: [
        data => new URLSearchParams(data).toString(),
      ],
      validateStatus: status => status < 500,
      timeout: this.requestTimeout * 2, // Give extra time for bulk requests
    })

    if (!response || response.status !== 200) {
      throw new Error(`Bulk API request failed with status ${response?.status}`)
    }

    return response.data
  }

  /**
   * Process bulk API results and return tidy data format
   * Returns a flat array where each entry represents simulateurSlug + period + action combination
   */
  private processBulkResults(bulkResults: any[], actions: ActionType[], periods: TimePeriod[], simulateurSlugs: string[]): TidyDataEntry[] {
    const tidyData: TidyDataEntry[] = []

    if (!Array.isArray(bulkResults)) {
      console.warn('Bulk results is not an array:', bulkResults)
      return tidyData
    }

    let resultIndex = 0

    // Loop through action → simulateurSlug → period to match fetchEventsBulk order
    for (const action of actions) {
      for (const simulateurSlug of simulateurSlugs) {
        for (const period of periods) {
          if (resultIndex >= bulkResults.length) {
            console.warn(`Missing result for ${action} ${simulateurSlug} ${period.start}-${period.end}`)
            resultIndex++
            continue
          }

          const periodKey = `${period.start},${period.end}`

          const periodData = bulkResults[resultIndex]
          if (Array.isArray(periodData)) {
            // Process the data for this specific action/simulator/period combination
            const count = this.extractCountFromActionData(periodData, action, simulateurSlug)

            // Add tidy data entry
            tidyData.push({
              simulateurSlug,
              periodKey,
              action,
              count,
            })
          }
          else {
            console.warn(`Invalid data for ${action} ${simulateurSlug} ${period.start}-${period.end}:`, periodData)
            // Still add entry with 0 count to maintain data structure
            tidyData.push({
              simulateurSlug,
              periodKey,
              action,
              count: 0,
            })
          }

          resultIndex++
        }
      }
    }

    return tidyData
  }

  /**
   * Extract simulator ID from event name (e.g., "[simulator-id][source]" -> "simulator-id")
   */
  private extractSimulatorSlug(eventName?: string): string | null {
    if (!eventName) {
      return null
    }

    const match = eventName.match(/\[(.*?)\]/)
    return match ? match[1] : null
  }

  /**
   * Extract count from action data for a specific simulator and action
   */
  private extractCountFromActionData(actionData: MatomoEventData[], action: string, simulateurSlug: string): number {
    let totalCount = 0

    for (const event of actionData) {
      const extractedSimulatorId = this.extractSimulatorSlug(event.Events_EventName)
      if (extractedSimulatorId === simulateurSlug) {
        // Use appropriate count based on action type
        switch (action) {
          case 'Start':
          case 'Submit':
            totalCount += event.nb_events ?? 0
            break
          case 'Eligibility':
            totalCount += event.nb_visits ?? 0
            break
        }
      }
    }

    return totalCount
  }
}
