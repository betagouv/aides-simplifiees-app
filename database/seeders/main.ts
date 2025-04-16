import { BaseSeeder } from '@adonisjs/lucid/seeders'
import SimulateurSeeder from './simulateur_seeder.js'

export default class MainSeeder extends BaseSeeder {
  async run() {
    await this.db.transaction(async (trx) => {
      /**
       * Create an instance of simulateur seeder
       */
      const simulateurSeeder = new SimulateurSeeder(this.client)
      simulateurSeeder.client.transaction = trx

      await simulateurSeeder.run()
    })
  }
}
