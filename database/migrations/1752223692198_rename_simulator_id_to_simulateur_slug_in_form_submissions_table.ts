import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'form_submissions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /**
       * Rename simulator_id column to simulateur_slug
       * Note: This stores the simulateur slug, not the ID, so we don't add a foreign key constraint
       * The belongsTo relationship in the model will need to be configured to use slug as the foreign key
       */
      table.renameColumn('simulator_id', 'simulateur_slug')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revert the column name back to simulator_id
      table.renameColumn('simulateur_slug', 'simulator_id')
    })
  }
}
