import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration to update the nullability of specific columns
 */
export default class extends BaseSchema {
  async up() {
    await this.makeNullable({
      tableName: 'aides',
      columns: [
        'description',
        'content',
        'type',
        'usage',
        'instructeur',
      ],
    })
    await this.makeNullable({
      tableName: 'notions',
      columns: [
        'content',
      ],
    })
    await this.makeNullable({
      tableName: 'pages',
      columns: [
        'content',
      ],
    })
  }

  async down() {
    // We cannot revert the nullability change, so we leave this empty
  }

  /**
   * Helper function to make specified columns nullable in a given table
   */
  private async makeNullable({ tableName, columns }: { tableName: string, columns: string[] }) {
    for (const column of columns) {
      // Check if the table has the column
      const hasColumn = await this.hasColumn(tableName, column)
      if (hasColumn) {
        this.schema.alterTable(tableName, (table) => {
          table.text(column).nullable().alter()
        })
      }
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
