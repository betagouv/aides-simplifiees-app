import type { StatisticsSource } from '#services/statistics/types'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import StatisticsSnapshotService from '#services/statistics_snapshot_service'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import { DateTime } from 'luxon'

export default class StatisticsSync extends BaseCommand {
  static commandName = 'statistics:sync'
  static description = 'Sync statistics snapshots from multiple data sources (form_submissions, matomo)'

  static options: CommandOptions = {
    startApp: true, // Required to access database
  }

  @flags.string({
    description: 'Start date (YYYY-MM-DD). Defaults to yesterday.',
    alias: 'f',
  })
  declare from: string

  @flags.string({
    description: 'End date (YYYY-MM-DD). Defaults to yesterday.',
    alias: 't',
  })
  declare to: string

  @flags.string({
    description: 'Specific simulator slug to sync',
    alias: 's',
  })
  declare simulator: string

  @flags.boolean({
    description: 'Backfill all historical data from form_submissions',
  })
  declare backfill: boolean

  @flags.string({
    description: 'Data sources to sync (comma-separated: form_submissions,matomo). Defaults to all available.',
  })
  declare sources: string

  @flags.boolean({
    description: 'List available data sources and their status',
    alias: 'l',
  })
  declare list: boolean

  async run() {
    const service = new StatisticsSnapshotService()

    // List available providers if requested
    if (this.list) {
      this.logger.info('Available data sources:')
      const providers = service.getAllProviders()
      for (const provider of providers) {
        const status = provider.isAvailable ? this.colors.green('✓ available') : this.colors.red('✗ not configured')
        this.logger.info(`  ${provider.source}: ${provider.displayName} ${status}`)
        this.logger.info(`    Metrics: ${provider.availableMetrics.join(', ')}`)
      }
      return
    }

    // Default to yesterday (last complete day)
    const yesterday = DateTime.now().setZone('utc').minus({ days: 1 }).toISODate()!

    let startDate = this.from || yesterday
    let endDate = this.to || yesterday

    // Parse sources
    let sourcesToSync: StatisticsSource[] | undefined
    if (this.sources) {
      sourcesToSync = this.sources.split(',').map(s => s.trim()) as StatisticsSource[]
      const availableSources = service.getAvailableSources()
      const invalidSources = sourcesToSync.filter(s => !availableSources.includes(s))
      if (invalidSources.length > 0) {
        this.logger.error(`Invalid sources: ${invalidSources.join(', ')}`)
        this.logger.info(`Available sources: ${availableSources.join(', ')}`)
        this.exitCode = 1
        return
      }
    }

    // If backfill flag is set, get the oldest form_submission date
    if (this.backfill) {
      this.logger.info('Backfill mode: fetching date range from form_submissions...')

      const dbModule = await import('@adonisjs/lucid/services/db')
      const db = dbModule.default
      const dateRange = await db
        .from('form_submissions')
        .select(db.raw('MIN(DATE(created_at AT TIME ZONE \'UTC\')) as oldest'))
        .first()

      if (dateRange?.oldest) {
        startDate = DateTime.fromJSDate(dateRange.oldest).toISODate()!
        endDate = yesterday
        this.logger.info(`Backfilling from ${startDate} to ${endDate}`)
      }
      else {
        this.logger.error('No form_submissions found')
        return
      }
    }

    // Show what we're going to sync
    const activeSources = sourcesToSync || service.getAvailableSources()
    this.logger.info(`Syncing statistics snapshots...`)
    this.logger.info(`  Date range: ${startDate} to ${endDate}`)
    this.logger.info(`  Sources: ${activeSources.join(', ')}`)
    if (this.simulator) {
      this.logger.info(`  Simulator: ${this.simulator}`)
    }

    try {
      const simulateurs = this.simulator ? [this.simulator] : undefined
      const result = await service.backfillSnapshots(startDate, endDate, simulateurs, sourcesToSync)

      this.logger.success(`✓ Sync completed!`)
      this.logger.info(`  Total created: ${result.created} snapshots`)
      this.logger.info(`  Total updated: ${result.updated} snapshots`)

      // Show per-source breakdown
      this.logger.info(`\nPer source:`)
      for (const [source, stats] of Object.entries(result.bySource)) {
        this.logger.info(`  ${source}: ${stats.created} created, ${stats.updated} updated`)
      }

      // Show summary
      const summary = await service.getSummary()
      this.logger.info(`\nSnapshot summary:`)
      this.logger.info(`  Total snapshots: ${summary.totalSnapshots}`)
      this.logger.info(`  Date range: ${summary.dateRange.oldest} to ${summary.dateRange.newest}`)
      this.logger.info(`  By source:`)
      for (const [source, count] of Object.entries(summary.bySource)) {
        this.logger.info(`    ${source}: ${count}`)
      }
    }
    catch (error) {
      this.logger.error(`Sync failed: ${error instanceof Error ? error.message : error}`)
      this.exitCode = 1
    }
  }
}
