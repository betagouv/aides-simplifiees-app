import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'type_aides'

  async up() {
    const hasTable = await this.schema.hasTable(this.tableName)
    if (!hasTable) {
      this.schema.createTable(this.tableName, (table) => {
        table.increments('id')
        table.string('slug').notNullable().unique()
        table.string('label').notNullable()
        table.string('icon_name').notNullable()

        table.timestamp('created_at')
        table.timestamp('updated_at')
      })
    }
  }

  async down() {
    const hasTable = await this.schema.hasTable(this.tableName)
    if (hasTable) {
      this.schema.dropTable(this.tableName)
    }
  }
}
