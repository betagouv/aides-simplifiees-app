import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'statistics_snapshots'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Dimensions - stored in UTC
      table.date('date').notNullable()
      table.string('simulateur_slug', 255).notNullable()
      table.string('source', 50).notNullable() // 'form_submissions' | 'matomo'

      // Metrics
      table.integer('submit_count').defaultTo(0)
      table.integer('eligibility_count').defaultTo(0)
      table.integer('start_count').defaultTo(0) // Matomo only

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Unique constraint: one row per day × simulator × source
      table.unique(['date', 'simulateur_slug', 'source'])
    })

    // Add indexes for performance
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['date'], 'idx_stats_snapshots_date')
      table.index(['simulateur_slug'], 'idx_stats_snapshots_simulateur')
      table.index(['date', 'simulateur_slug'], 'idx_stats_snapshots_date_sim')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
