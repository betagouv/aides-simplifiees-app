import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'simulateurs'

  async up() {
    // delete the short_title column
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('short_title')
    })
  }

  async down() {
    // add the short_title column
    this.schema.table(this.tableName, (table) => {
      table.string('short_title').nullable()
    })
  }
}
