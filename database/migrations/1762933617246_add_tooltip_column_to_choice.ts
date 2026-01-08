import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'choices'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'tooltip')
    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.string('tooltip').nullable()
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'tooltip')
    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('tooltip')
      })
    }
  }
}
