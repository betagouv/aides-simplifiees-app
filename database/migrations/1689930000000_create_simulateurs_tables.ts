import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'simulateurs'

  async up() {
    // Create simulateurs table
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('slug').notNullable().unique()
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('short_title').nullable()
      table.string('pictogram_path').nullable()
      table.enum('status', ['published', 'draft']).defaultTo('draft')
      table.text('built_json').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // Create steps table
    this.schema.createTable('steps', (table) => {
      table.increments('id')
      table.string('slug').notNullable()
      table.string('title').notNullable()
      table
        .integer('simulateur_id')
        .unsigned()
        .references('id')
        .inTable('simulateurs')
        .onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Add unique constraint on (slug, simulateur_id)
      table.unique(['slug', 'simulateur_id'])
    })

    // Create questions table
    this.schema.createTable('questions', (table) => {
      table.increments('id')
      table.string('slug').notNullable()
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('type').notNullable()
      table.integer('step_id').unsigned().references('id').inTable('steps').onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Add unique constraint on (slug, step_id)
      table.unique(['slug', 'step_id'])
    })

    // Create choices table
    this.schema.createTable('choices', (table) => {
      table.increments('id')
      table.string('slug').notNullable()
      table.string('title').notNullable()
      table
        .integer('question_id')
        .unsigned()
        .references('id')
        .inTable('questions')
        .onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Add unique constraint on (slug, question_id)
      table.unique(['slug', 'question_id'])
    })
  }

  async down() {
    // Drop in reverse order to avoid foreign key constraints issues
    this.schema.dropTable('choices')
    this.schema.dropTable('questions')
    this.schema.dropTable('steps')
    this.schema.dropTable(this.tableName)
  }
}
