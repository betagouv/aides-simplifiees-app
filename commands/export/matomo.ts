/* eslint-disable perfectionist/sort-imports */
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import logger from '@adonisjs/core/services/logger'
import axios from 'axios'
import Simulateur from '#models/simulateur'
import LoggingService from '#services/logging_service'
import type { TimePeriod } from '#services/matomo_reporting_service'
import env from '#start/env'

interface ExtendedTidyDataEntry {
  simulateurSlug: string
  simulateurTitle: string
  periodStart: string
  periodEnd: string
  week: string
  action: string
  count: number
}

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

type ExtendedActionType = 'Start' | 'Submit' | 'Eligibility' | 'Answer'

/**
 * Enhanced Matomo service using bulk requests like the original service
 */
class MatomoExportService {
  private loggingService: LoggingService
  private config: MatomoConfig
  private readonly requestTimeout = 5000

  get endpoint(): string {
    return `${this.config.url}/index.php`
  }

  constructor(config: MatomoConfig) {
    this.loggingService = new LoggingService(logger)
    this.config = config
  }

  /**
   * Fetch all event counts including Answer actions using bulk requests
   */
  async fetchAllEventsCount(
    simulateurSlugs: string[],
    periods: TimePeriod[],
    includeAnswers: boolean = false,
  ): Promise<ExtendedTidyDataEntry[]> {
    const actions: ExtendedActionType[] = ['Start', 'Submit', 'Eligibility']
    if (includeAnswers) {
      actions.push('Answer')
    }

    const timer = this.loggingService.startTimer('matomo_export_fetch_events', {
      simulateurSlugs,
      periodCount: periods.length,
      actions,
    })

    try {
      this.loggingService.logExternalApiCall('Matomo', '/index.php', 'POST', {
        simulateurSlugs,
        actions,
        periodCount: periods.length,
        totalRequests: actions.length * simulateurSlugs.length * periods.length,
      })

      const urls = this.constructBulkUrls(actions, periods, simulateurSlugs)
      const bulkResults = await this.fetchBulk(urls)
      const results = this.processBulkResults(bulkResults, actions, periods, simulateurSlugs)

      timer.stopWithMessage('All Matomo events fetched successfully', {
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
        operation: 'fetchAllEventsCount',
      })

      return []
    }
  }

  /**
   * Construct bulk API URLs for fetching event counts (enhanced version)
   */
  private constructBulkUrls(actions: ExtendedActionType[], periods: TimePeriod[], simulateurSlugs: string[]): Record<string, string> {
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

          // Create filter pattern for each action type - use exact same format as working service
          let filterPattern: string
          if (action === 'Answer') {
            // Answer actions have different pattern - filter by action and simulator slug
            filterPattern = `^${action} - \\[${simulateurSlug.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\]`
          }
          else {
            // Use the exact same pattern as the original working service
            filterPattern = `^${action} - \\[${simulateurSlug.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\]`
          }

          Object.assign(baseParams, {
            filter_pattern: filterPattern,
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
   * Fetch bulk data from Matomo API (same as original service)
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

    // Log first few URLs for debugging
    const urlEntries = Object.entries(urls)
    logger.info('Debugging bulk request URLs', {
      sampleUrls: urlEntries.slice(0, 2).map(([key, url]) => ({ key, url: decodeURIComponent(url) })),
      totalCount: urlEntries.length,
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
   * Process bulk API results (enhanced version with Answer support)
   */
  private processBulkResults(bulkResults: any[], actions: ExtendedActionType[], periods: TimePeriod[], simulateurSlugs: string[]): ExtendedTidyDataEntry[] {
    const tidyData: ExtendedTidyDataEntry[] = []

    if (!Array.isArray(bulkResults)) {
      this.loggingService.logWarning('Bulk results is not an array', undefined, {
        bulkResults,
        type: typeof bulkResults,
      })
      return tidyData
    }

    let resultIndex = 0

    // Loop through action → simulateurSlug → period to match constructBulkUrls order
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

          const periodData = bulkResults[resultIndex]
          let count = 0

          if (Array.isArray(periodData)) {
            count = this.extractCountFromActionData(periodData, action, simulateurSlug)
          }
          else {
            this.loggingService.logWarning('Invalid data format from Matomo API', undefined, {
              action,
              simulateurSlug,
              period: `${period.start}-${period.end}`,
              dataType: typeof periodData,
              isArray: Array.isArray(periodData),
            })
          }

          // Add tidy data entry
          tidyData.push({
            simulateurSlug,
            simulateurTitle: '', // Will be filled later
            periodStart: period.start,
            periodEnd: period.end,
            week: this.getWeekIdentifier(period.start),
            action,
            count,
          })

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
   * Extract count from action data (enhanced version with Answer support)
   */
  private extractCountFromActionData(actionData: MatomoEventData[], action: ExtendedActionType, simulateurSlug: string): number {
    let totalCount = 0

    for (const event of actionData) {
      if (action === 'Answer') {
        // For Answer actions, check if the event name contains the simulator slug
        if (event.Events_EventName?.includes(`[${simulateurSlug}]`)) {
          totalCount += event.nb_events ?? 0
        }
      }
      else {
        // For other actions, use the existing logic from original service
        const extractedSimulatorId = this.extractSimulatorSlug(event.Events_EventName)
        if (extractedSimulatorId === simulateurSlug) {
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
    }

    return totalCount
  }

  /**
   * Extract simulator slug from event name (same as original service)
   */
  private extractSimulatorSlug(eventName?: string): string | null {
    if (!eventName) {
      return null
    }

    const match = eventName.match(/\[(.*?)\]/)
    return match ? match[1] : null
  }

  /**
   * Get week identifier (YYYY-Www format)
   */
  private getWeekIdentifier(dateString: string): string {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const weekNumber = this.getWeekNumber(date)
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }
}

/**
 * Get the specified number of past weeks (Monday to Sunday)
 */
function getPastWeekPeriods(numberOfWeeks = 8): TimePeriod[] {
  const periods = []
  const lastSunday = new Date()
  lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay())
  lastSunday.setHours(0, 0, 0, 0)

  for (let i = 1; i <= numberOfWeeks; i++) {
    const weekEnd = new Date(lastSunday)
    weekEnd.setDate(lastSunday.getDate() - ((i - 1) * 7))
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)

    periods.push({
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    })
  }
  return periods
}

/**
 * Convert tidy data to extended format with additional fields
 */
function enrichTidyData(
  data: ExtendedTidyDataEntry[],
  simulatorTitles: Record<string, string>,
): ExtendedTidyDataEntry[] {
  return data.map((entry) => {
    return {
      ...entry,
      simulateurTitle: simulatorTitles[entry.simulateurSlug] || entry.simulateurSlug,
    }
  })
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: ExtendedTidyDataEntry[]): string {
  const headers = [
    'simulateur_slug',
    'simulateur_title',
    'period_start',
    'period_end',
    'week',
    'action',
    'count',
  ]

  const csvRows = [headers.join(',')]

  for (const row of data) {
    const values = [
      escapeCsvValue(row.simulateurSlug),
      escapeCsvValue(row.simulateurTitle),
      row.periodStart,
      row.periodEnd,
      row.week,
      row.action,
      row.count.toString(),
    ]
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

/**
 * Escape CSV values that contain commas, quotes, or newlines
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default class MatomoExport extends BaseCommand {
  static commandName = 'export:matomo'
  static description = 'Export Matomo tracking data to CSV for analytics and data visualization'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.number({ description: 'Number of past weeks to fetch', default: 8 })
  declare weeks: number

  @flags.string({ description: 'Output CSV file path', default: './matomo_export.csv' })
  declare output: string

  @flags.boolean({ description: 'Include Answer actions in addition to Start/Submit/Eligibility' })
  declare includeAnswers: boolean

  async run() {
    const loggingService = new LoggingService(logger)
    const timer = loggingService.startTimer('matomo_export_command')

    try {
      // Validate Matomo configuration
      const matomoUrl = env.get('MATOMO_URL')
      const matomoToken = env.get('MATOMO_TOKEN')
      const matomoSiteId = env.get('MATOMO_SITE_ID')

      if (!matomoUrl || !matomoToken || !matomoSiteId) {
        this.logger.error('Missing Matomo configuration. Please check your environment variables:')
        this.logger.error('- MATOMO_URL')
        this.logger.error('- MATOMO_TOKEN')
        this.logger.error('- MATOMO_SITE_ID')
        this.exitCode = 1
        return
      }

      this.logger.info('Starting Matomo data export...')
      this.logger.info(`Fetching data for ${this.weeks} weeks`)
      this.logger.info(`Output file: ${this.output}`)
      this.logger.info(`Include answers: ${this.includeAnswers ? 'Yes' : 'No'}`)

      // Initialize Matomo service
      const matomoService = new MatomoExportService({
        url: matomoUrl,
        token: matomoToken,
        siteId: matomoSiteId,
      })

      // Get published simulators
      this.logger.info('Fetching published simulators...')
      const publishedSimulators = await Simulateur.query()
        .where('status', 'published')
        .select('slug', 'title')

      if (publishedSimulators.length === 0) {
        this.logger.warning('No published simulators found')
        return
      }

      this.logger.info(`Found ${publishedSimulators.length} published simulators`)

      const simulatorTitles = publishedSimulators.reduce((acc, simulator) => {
        acc[simulator.slug] = simulator.title
        return acc
      }, {} as Record<string, string>)

      const allowedSimulatorIds = publishedSimulators.map(s => s.slug)

      // Fetch data from Matomo
      this.logger.info('Fetching data from Matomo API...')
      const data = await matomoService.fetchAllEventsCount(
        allowedSimulatorIds,
        getPastWeekPeriods(this.weeks),
        this.includeAnswers,
      )

      this.logger.info(`Fetched ${data.length} data points`)

      // Enrich data with additional fields
      const enrichedData = enrichTidyData(data, simulatorTitles)

      // Convert to CSV
      this.logger.info('Converting to CSV format...')
      const csvContent = convertToCSV(enrichedData)

      // Write to file
      const outputPath = resolve(this.output)
      writeFileSync(outputPath, csvContent, 'utf8')

      this.logger.info(`Export completed successfully!`)
      this.logger.info(`Total records: ${enrichedData.length}`)
      this.logger.info(`File saved to: ${outputPath}`)

      // Show summary statistics
      const summary = enrichedData.reduce((acc, entry) => {
        acc[entry.action] = (acc[entry.action] || 0) + entry.count
        return acc
      }, {} as Record<string, number>)

      this.logger.info('\nSummary by action:')
      Object.entries(summary).forEach(([action, count]) => {
        this.logger.info(`  ${action}: ${count} events`)
      })

      timer.stopWithMessage('Matomo export completed successfully', {
        recordsExported: enrichedData.length,
        outputPath,
      })
    }
    catch (error) {
      timer.stopWithMessage('Matomo export failed', {
        error: error instanceof Error ? error.message : String(error),
      })

      this.logger.error(`Error during export: ${error instanceof Error ? error.message : String(error)}`)
      this.exitCode = 1
    }
  }
}
