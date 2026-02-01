import LoggingService from '#services/logging_service'
import logger from '@adonisjs/core/services/logger'
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

/**
 * Data quality monitoring configuration
 * Bot detection thresholds and anomaly detection settings
 */
export interface DataQualityConfig {
  /** Maximum events/visit ratio before flagging as bot (default: 10) */
  maxEventsPerVisit: number
  /** Volume spike multiplier vs 7-day baseline to trigger alert (default: 3) */
  volumeSpikeMultiplier: number
  /** Minimum visits to consider data statistically significant (default: 5) */
  minVisitsThreshold: number
}

/**
 * Data quality alert structure
 */
export interface DataQualityAlert {
  type: 'bot_traffic' | 'volume_spike' | 'unknown_action' | 'high_unknown_sources'
  severity: 'warning' | 'critical'
  message: string
  details: Record<string, any>
  timestamp: Date
}

const DEFAULT_DATA_QUALITY_CONFIG: DataQualityConfig = {
  maxEventsPerVisit: 10,
  volumeSpikeMultiplier: 3,
  minVisitsThreshold: 5,
}

export default class MatomoReportingService {
  private loggingService: LoggingService
  private config: MatomoConfig
  private readonly requestTimeout = 5000
  private dataQualityConfig: DataQualityConfig
  private dataQualityAlerts: DataQualityAlert[] = []

  get endpoint(): string {
    return `${this.config.url}/index.php`
  }

  constructor(config: MatomoConfig, dataQualityConfig?: Partial<DataQualityConfig>) {
    this.loggingService = new LoggingService(logger)
    this.config = config
    this.dataQualityConfig = { ...DEFAULT_DATA_QUALITY_CONFIG, ...dataQualityConfig }
  }

  /**
   * Get current data quality alerts
   */
  getDataQualityAlerts(): DataQualityAlert[] {
    return [...this.dataQualityAlerts]
  }

  /**
   * Clear all data quality alerts
   */
  clearDataQualityAlerts(): void {
    this.dataQualityAlerts = []
  }

  /**
   * Check if visit appears to be bot traffic based on events/visit ratio
   * Normal users have 1-3 events/visit; bots often have 10+
   */
  private isLikelyBotTraffic(eventsPerVisit: number): boolean {
    return eventsPerVisit > this.dataQualityConfig.maxEventsPerVisit
  }

  /**
   * Add a data quality alert
   */
  private addDataQualityAlert(alert: Omit<DataQualityAlert, 'timestamp'>): void {
    const fullAlert: DataQualityAlert = {
      ...alert,
      timestamp: new Date(),
    }
    this.dataQualityAlerts.push(fullAlert)

    // Also log for monitoring
    this.loggingService.logWarning(`Data quality alert: ${alert.type}`, undefined, {
      alert: fullAlert,
    })
  }

  /**
   * Check volume against baseline and alert if spike detected
   */
  checkVolumeSpike(currentCount: number, baselineAverage: number, context: Record<string, any>): boolean {
    if (baselineAverage === 0) {
      return false
    }

    const ratio = currentCount / baselineAverage
    const isSpike = ratio >= this.dataQualityConfig.volumeSpikeMultiplier

    if (isSpike) {
      this.addDataQualityAlert({
        type: 'volume_spike',
        severity: ratio >= 5 ? 'critical' : 'warning',
        message: `Volume ${ratio.toFixed(1)}x baseline detected`,
        details: { currentCount, baselineAverage, ratio, ...context },
      })
    }

    return isSpike
  }

  async fetchEventsCount(
    simulateurSlugs: string[],
    getPeriods: () => TimePeriod[],
  ): Promise<TidyDataEntry[]> {
    const timer = this.loggingService.startTimer('matomo_fetch_events', {
      simulateurSlugs,
      periodCount: getPeriods().length,
    })

    try {
      const actions: ActionType[] = ['Start', 'Submit', 'Eligibility']
      // const actions: ActionType[] = ['Start', 'Submit', 'Eligibility', 'IntermediaryResults']
      const periods = getPeriods()

      this.loggingService.logExternalApiCall('Matomo', '/index.php', 'POST', {
        simulateurSlugs,
        actions,
        periodCount: periods.length,
        totalRequests: actions.length * simulateurSlugs.length * periods.length,
      })

      const urls = this.constructBulkUrls(actions, periods, simulateurSlugs)
      const bulkResults = await this.fetchBulk(urls)
      const results = this.processBulkResults(bulkResults, actions, periods, simulateurSlugs)

      timer.stopWithMessage('Matomo events count fetched successfully', {
        resultsCount: results.length,
      })

      return results
    }
    catch (error) {
      timer.stopWithMessage('Failed to fetch Matomo event counts', {
        error: error instanceof Error ? error.message : String(error),
      })

      this.loggingService.logError(error instanceof Error ? error : new Error(String(error)), undefined, {
        simulateurSlugs,
        operation: 'fetchEventsCount',
      })

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
            // NOTE: Removed secondaryDimension to avoid data duplication
            // Previously used 'eventName' which caused results to be split by source domain,
            // leading to 100+ entries being summed together and massive over-counting
            showMetadata: '0',
          }

          // Use filter_column and filter_pattern to efficiently filter at API level
          // Event labels are formatted as: "Action - [simulator-slug][source-domain]"
          // Use strict pattern to exclude SQL injection attempts and other malformed event names
          Object.assign(baseParams, {
            filter_pattern: `^${action} - \\[${simulateurSlug}\\]`,
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

    this.loggingService.logExternalApiCall('Matomo', '/index.php', 'POST', {
      bulkRequestCount: Object.keys(urls).length,
      endpoint: this.endpoint,
    })

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
      const error = new Error(`Bulk API request failed with status ${response?.status}`)
      this.loggingService.logError(error, undefined, {
        status: response?.status,
        endpoint: this.endpoint,
        bulkRequestCount: Object.keys(urls).length,
      })
      throw error
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
      this.loggingService.logWarning('Bulk results is not an array', undefined, {
        bulkResults,
        type: typeof bulkResults,
      })
      return tidyData
    }

    let resultIndex = 0

    // Loop through action → simulateurSlug → period to match fetchEventsBulk order
    for (const action of actions) {
      for (const simulateurSlug of simulateurSlugs) {
        for (const period of periods) {
          if (resultIndex >= bulkResults.length) {
            this.loggingService.logWarning('Missing result for bulk request', undefined, {
              action,
              simulateurSlug,
              period: `${period.start}-${period.end}`,
              resultIndex,
              totalResults: bulkResults.length,
            })
            resultIndex++
            continue
          }

          const periodKey = `${period.start},${period.end}`

          const periodData = bulkResults[resultIndex]
          if (Array.isArray(periodData)) {
            // Log first item for debugging
            if (periodData.length > 0) {
              this.loggingService.logDebug('Bulk result item sample', {
                action,
                simulateurSlug,
                period: `${period.start}-${period.end}`,
                firstItem: JSON.stringify(periodData[0]),
                itemCount: periodData.length,
              })
            }

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
            this.loggingService.logWarning('Invalid data format from Matomo API', undefined, {
              action,
              simulateurSlug,
              period: `${period.start}-${period.end}`,
              dataType: typeof periodData,
              isArray: Array.isArray(periodData),
            })
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

    this.loggingService.logBusinessEvent('matomo_bulk_results_processed', {
      totalEntries: tidyData.length,
      actionsCount: actions.length,
      simulateursCount: simulateurSlugs.length,
      periodsCount: periods.length,
    })

    return tidyData
  }

  /**
   * Extract simulator ID from event label (e.g., "Start - [simulator-id][source]" -> "simulator-id")
   * Handles both bulk API format (label field) and single API format (Events_EventName field)
   */
  private extractSimulatorSlug(eventLabel?: string): string | null {
    if (!eventLabel) {
      return null
    }

    // Match first bracketed value: "Action - [simulator-slug][source]" -> "simulator-slug"
    const match = eventLabel.match(/\[(.*?)\]/)
    return match ? match[1] : null
  }

  /**
   * Extract count from action data for a specific simulator and action
   *
   * IMPORTANT: Matomo tracks events from multiple source domains:
   * - Old server IP (e.g., 163.172.76.91) - former production infrastructure
   * - Current domain (e.g., monlogementetudiant.beta.gouv.fr)
   * - Generic referrers (e.g., [website]) - missing referrer headers
   * - Various test/development domains
   *
   * All these sources represent LEGITIMATE traffic that must be SUMMED together,
   * not treated as duplicates. Events split by source domain during migrations
   * or across infrastructure are the SAME simulator accessed from different origins.
   *
   * This method:
   * 1. Validates labels match strict format: "Action - [simulator][source]"
   * 2. Filters out attack attempts (SQL injection, path traversal)
   * 3. Sums events across all legitimate source domains
   */
  private extractCountFromActionData(actionData: MatomoEventData[], action: string, simulateurSlug: string): number {
    const matchedEvents: Array<{ label: string, count: number }> = []

    // Strict regex to match only legitimate event labels: "Action - [simulator-slug][source]"
    // This excludes SQL injection and path traversal attempts like:
    // - "Start$(expr...) - [simulator][source]"
    // - "../../../etc/passwd[simulator][source]Survey - Start"
    const validLabelPattern = new RegExp(`^${action} - \\[${simulateurSlug}\\]\\[.+\\]$`)

    for (const event of actionData) {
      // Bulk API uses 'label' field, single API uses 'Events_EventName'
      const eventLabel = (event as any).label ?? event.Events_EventName

      // Strict validation: only accept labels matching exact format
      if (!eventLabel || !validLabelPattern.test(eventLabel)) {
        continue
      }

      const extractedSimulatorId = this.extractSimulatorSlug(eventLabel)

      // Double-check simulator ID matches (should always pass if regex matched)
      if (extractedSimulatorId === simulateurSlug) {
        // Use appropriate count based on action type
        // Note: Bulk API returns values as strings, so we parse them
        let count = 0
        const visits = Number(event.nb_visits) || 1 // Default to 1 to avoid division by zero
        const events = Number(event.nb_events) || 0

        // Bot traffic filtering: skip entries with abnormally high events/visit ratio
        // Normal users have 1-3 events/visit; bots often have 10+
        const eventsPerVisit = visits > 0 ? events / visits : events
        if (this.isLikelyBotTraffic(eventsPerVisit)) {
          this.addDataQualityAlert({
            type: 'bot_traffic',
            severity: eventsPerVisit > 30 ? 'critical' : 'warning',
            message: `Bot traffic detected: ${eventsPerVisit.toFixed(1)} events/visit`,
            details: {
              eventLabel,
              events,
              visits,
              eventsPerVisit,
              action,
              simulateurSlug,
            },
          })
          // Skip this entry - likely bot traffic
          continue
        }

        switch (action) {
          case 'Start':
          case 'Submit':
            count = events
            break
          case 'Eligibility':
            count = visits
            break
        }

        if (count > 0) {
          matchedEvents.push({ label: eventLabel, count })
        }
      }
    }

    // Multiple entries with different source domains ([website], [subdomain.site.fr], etc.)
    // represent events tracked from different referrer URLs - these should be SUMMED.
    // Previously thought these were duplicates, but they're actually legitimate events
    // from different traffic sources that Matomo separates when using certain filters.
    if (matchedEvents.length > 1) {
      this.loggingService.logWarning('Multiple source domains for same action/simulator/day', undefined, {
        action,
        simulateurSlug,
        sourceCount: matchedEvents.length,
        totalEvents: matchedEvents.reduce((sum, e) => sum + e.count, 0),
        bySource: matchedEvents.map(e => ({ label: e.label, count: e.count })),
      })
    }

    // Sum all matching events across different source domains
    const count = matchedEvents.reduce((sum, e) => sum + e.count, 0)

    // Log for debugging if no count found but data exists
    if (count === 0 && actionData.length > 0) {
      this.loggingService.logWarning('No matching events in action data', undefined, {
        action,
        simulateurSlug,
        dataCount: actionData.length,
        // Log 'label' field (bulk API) or 'Events_EventName' (single API)
        eventLabels: actionData.slice(0, 3).map(e => (e as any).label ?? e.Events_EventName),
      })
    }

    return count
  }
}
