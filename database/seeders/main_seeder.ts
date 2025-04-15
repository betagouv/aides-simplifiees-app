import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from '#database/seeders/user_seeder'
import PageSeeder from '#database/seeders/page_seeder'
import NotionSeeder from '#database/seeders/notion_seeder'
import AideSeeder from '#database/seeders/aide_seeder'

export default class MainSeeder extends BaseSeeder {
  async run() {
    await new UserSeeder(this.client).run()
    await new PageSeeder(this.client).run()
    await new NotionSeeder(this.client).run()
    await new AideSeeder(this.client).run()

    console.log('✓ All seeders executed successfully')
  }
}
