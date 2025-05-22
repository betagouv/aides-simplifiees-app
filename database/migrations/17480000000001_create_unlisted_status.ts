import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    /**
     * Add unlisted status to the status column
     * This approach works around PostgreSQL enum type modification limitations
     */

    // For each table, check if the status column exists before proceeding
    const tables = ['notions', 'pages', 'aides', 'simulateurs']

    for (const tableName of tables) {
      // Check if the table exists
      const tableExists = await this.db.schema.hasTable(tableName)
      if (!tableExists) {
        continue
      }

      // Check if status column exists
      const hasStatusColumn = await this.db.schema.hasColumn(tableName, 'status')

      if (hasStatusColumn) {
        // Use raw SQL to modify the existing enum type
        await this.db.rawQuery(`
          -- Drop the constraint if it exists
          ALTER TABLE ${tableName}
          DROP CONSTRAINT IF EXISTS ${tableName}_status_check;

          -- Update enum values through a multi-step process
          ALTER TABLE ${tableName}
          ALTER COLUMN status TYPE VARCHAR(20);

          -- Add new constraint
          ALTER TABLE ${tableName}
          ADD CONSTRAINT ${tableName}_status_check
          CHECK (status IN ('published', 'draft', 'unlisted'));

          -- Set default value
          ALTER TABLE ${tableName}
          ALTER COLUMN status SET DEFAULT 'draft';
        `)
      }
      else {
        // If the column doesn't exist, create it
        this.schema.alterTable(tableName, (table) => {
          table.enum('status', ['published', 'draft', 'unlisted']).defaultTo('draft')
        })
      }
    }
  }

  async down() {
    /**
     * Remove unlisted status from the status column
     */

    const tables = ['notions', 'pages', 'aides', 'simulateurs']

    for (const tableName of tables) {
      // Check if the table exists
      const tableExists = await this.db.schema.hasTable(tableName)
      if (!tableExists) {
        continue
      }

      // Check if status column exists
      const hasStatusColumn = await this.db.schema.hasColumn(tableName, 'status')

      if (hasStatusColumn) {
        // Use raw SQL to revert enum values
        await this.db.rawQuery(`
          -- Drop the check constraint if it exists
          ALTER TABLE ${tableName}
          DROP CONSTRAINT IF EXISTS ${tableName}_status_check;

          -- Update column type
          ALTER TABLE ${tableName}
          ALTER COLUMN status TYPE VARCHAR(20);

          -- Add new constraint
          ALTER TABLE ${tableName}
          ADD CONSTRAINT ${tableName}_status_check
          CHECK (status IN ('published', 'draft'));

          -- Set default value
          ALTER TABLE ${tableName}
          ALTER COLUMN status SET DEFAULT 'draft';
        `)
      }
    }
  }
}
