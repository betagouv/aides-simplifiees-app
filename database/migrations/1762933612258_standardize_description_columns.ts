import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Fix description and metaDescription columns for Pages
    await this.fixDescription('pages')

    // Fix description and metaDescription columns for Notions
    await this.fixDescription('notions')

    // Fix description and metaDescription columns for Aides
    await this.fixDescription('aides')

    // Fix description and metaDescription columns for Simulateurs
    await this.fixDescription('simulateurs')
  }

  async down() {
    // No need to rollback changes as these standardize columns that should already exist
  }

  /**
   * Helper function to ensure each table has the correct description column types
   */
  private async fixDescription(tableName: string) {
    // Check if the table has a description column
    const hasDescription = await this.hasColumn(tableName, 'description')
    if (!hasDescription) {
      this.schema.alterTable(tableName, (table) => {
        table.text('description').nullable()
      })
    }

    // Check if the table has a meta_description column
    const hasMetaDescription = await this.hasColumn(tableName, 'meta_description')
    if (!hasMetaDescription) {
      this.schema.alterTable(tableName, (table) => {
        table.text('meta_description').nullable()
      })
    }
  }

  /**
   * Helper function to check if a table has a specific column
   */
  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    try {
      const knex = this.db
      const hasColumn = await knex.schema.hasColumn(tableName, columnName)
      return hasColumn
    }
    catch (error) {
      console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error)
      return false
    }
  }
}
