import TypeAide from '#models/type_aide'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class TypeAideSeeder extends BaseSeeder {
  async run() {
    // Check if type_aides already exist and delete them
    const typeAidesCount = await TypeAide.query().count('* as total')

    if (typeAidesCount[0].$extras.total > 0) {
      await TypeAide.query().delete()
    }

    // Create type_aides
    await TypeAide.createMany([
      { slug: 'aide-financiere', label: 'Aide financière', iconName: 'ri:money-euro-circle-line' },
      { slug: 'pret', label: 'Prêt', iconName: 'ri:arrow-left-right-line' },
      { slug: 'garantie', label: 'Garantie', iconName: 'ri:chat-check-line' },
      { slug: 'statut-fiscal', label: 'Statut Fiscal', iconName: 'ri:chat-check-line' },
      { slug: 'credit-impot', label: 'Crédit d\'impôt', iconName: 'ri:money-euro-circle-line' },
    ])
  }
}
