/* eslint-disable perfectionist/sort-imports */
import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import logger from '@adonisjs/core/services/logger'
import type { TimePeriod } from '#services/matomo_reporting_service'
import MatomoReportingService from '#services/matomo_reporting_service'
import LoggingService from '#services/logging_service'
import Simulateur from '#models/simulateur'
import env from '#start/env'

/**
 * Get the specified number of past weeks (Monday to Sunday) which are already over
 */
function getPastWeekPeriods(numberOfWeeks = 4): TimePeriod[] {
  const periods = []
  const lastSunday = new Date()
  lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay()) // Set to last Sunday
  lastSunday.setHours(0, 0, 0, 0) // Normalize to start of day
  for (let i = 1; i <= numberOfWeeks; i++) {
    const weekEnd = new Date(lastSunday)
    weekEnd.setDate(lastSunday.getDate() - ((i - 1) * 7))
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6) // Start on the previous Monday

    periods.push({
      start: weekStart.toISOString().split('T')[0], // Format as YYYY-MM-DD
      end: weekEnd.toISOString().split('T')[0],
    })
  }
  return periods
}

export default class StatisticsController {
  private loggingService: LoggingService
  private matomoService: MatomoReportingService

  private url = env.get('MATOMO_URL')
  private token = env.get('MATOMO_TOKEN')
  private siteId = env.get('MATOMO_SITE_ID')

  constructor() {
    this.loggingService = new LoggingService(logger)

    if (!this?.url || !this?.token || !this?.siteId) {
      this.loggingService.logError(new Error('Missing Matomo configuration'), undefined, {
        context: 'statistics_controller_init',
        url: !!this.url,
        token: !!this.token,
        siteId: !!this.siteId,
      })
      throw new Exception('Missing Matomo configuration (url, token, or siteId)', { status: 500 })
    }
    this.matomoService = new MatomoReportingService({
      url: this.url,
      token: this.token,
      siteId: this.siteId,
    })
  }

  public async getStatistics({ response }: HttpContext) {
    const timer = this.loggingService.startTimer('statistics_fetch')

    try {
      // Get published simulators and their titles
      const publishedSimulators = await Simulateur.query()
        .where('status', 'published')
        .select('slug', 'title')

      const simulatorTitles = publishedSimulators.reduce((acc, simulator) => {
        acc[simulator.slug] = simulator.title
        return acc
      }, {} as Record<string, string>)

      const allowedSimulatorIds = publishedSimulators.map(s => s.slug)
      const data = await this.matomoService.fetchEventsCount(allowedSimulatorIds, () => getPastWeekPeriods(8))

      this.loggingService.logBusinessEvent('statistics_fetched', {
        simulatorCount: publishedSimulators.length,
        duration: timer.stop(),
      })

      response.header('Content-Type', 'application/json')
      return {
        data,
        simulatorTitles,
      }
    }
    catch (error: any) {
      this.loggingService.logError(error, undefined, {
        context: 'statistics_fetch',
        duration: timer.stop(),
      })

      return response.status(500).json({
        error: 'Failed to fetch statistics',
        details: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
