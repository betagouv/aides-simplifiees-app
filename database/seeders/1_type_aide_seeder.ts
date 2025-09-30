import TypeAide from '#models/type_aide'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class TypeAideSeeder extends BaseSeeder {
  async run() {
    // Create or update type_aides using idempotent operation
    await TypeAide.updateOrCreateMany('slug', [
      { slug: 'aide-financiere', label: 'Aide financière', iconName: 'ri:money-euro-circle-line' },
      { slug: 'pret', label: 'Prêt', iconName: 'ri:arrow-left-right-line' },
      { slug: 'garantie', label: 'Garantie', iconName: 'ri:chat-check-line' },
      { slug: 'statut-fiscal', label: 'Statut Fiscal', iconName: 'ri:chat-check-line' },
      { slug: 'credit-impot', label: 'Crédit d\'impôt', iconName: 'ri:money-euro-circle-line' },
    ])
  }
}
