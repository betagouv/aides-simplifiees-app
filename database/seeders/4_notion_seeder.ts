import fs from 'node:fs'
import path from 'node:path'
import Notion from '#models/notion'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class NotionSeeder extends BaseSeeder {
  async run() {
    const rootDir = path.dirname(new URL(import.meta.url).pathname)

    // Define notion data with their file paths and metadata
    const notionData = [
      {
        title: 'Avez-vous une reconnaissance administrative de votre situation de handicap ?',
        slug: 'handicap',
        description:
          'Pour bénéficier de certaines aides financières, il est nécessaire de disposer d\'une reconnaissance administrative de votre situation de handicap.',
        filename: 'handicap.md',
        status: 'published' as const,
      },
      {
        title: 'En savoir plus sur le chiffre d\'affaires généré via une micro-entreprise',
        slug: 'montant-ca-micro-entreprise',
        description: 'Connaître les règles de calcul applicables',
        filename: 'montant-ca-micro-entreprise.md',
        status: 'published' as const,
      },
      {
        title: 'En savoir plus sur les allocations chômage perçues au cours des 12 derniers mois',
        slug: 'montant-chomage',
        description: 'Connaître les règles de calcul applicables',
        filename: 'montant-chomage.md',
        status: 'published' as const,
      },
      {
        title: 'En savoir plus sur les ressources des parents au cours des 12 derniers mois',
        slug: 'montant-parents',
        description: 'Connaître les règles de calcul applicables',
        filename: 'montant-parents.md',
        status: 'published' as const,
      },
      {
        title:
          'Comment savoir si mon logement est conventionné pour l\'Aide Personnalisée au Logement (APL) ?',
        slug: 'logement-conventionne',
        description: 'Informations sur la convention APL',
        filename: 'logement-conventionne.md',
      },
      {
        title: 'Précisions sur le calcul du montant des charges locatives',
        slug: 'loyer-montant-charges',
        description:
          'Les charges locatives sont des dépenses liées à l\'entretien et au fonctionnement de votre logement.',
        filename: 'loyer-montant-charges.md',
      },
      {
        title: 'Comment connaître votre revenu imposable sur les 12 derniers mois ?',
        slug: 'salaire-imposable',
        description:
          'Pour bénéficier de certaines aides financières, il est nécessaire de déclarer votre revenu imposable sur les 12 derniers mois.',
        filename: 'salaire-imposable.md',
      },
    ]

    // Read content files and prepare data for insertion
    const notionsToCreate = notionData.map((notion) => {
      const content = fs.readFileSync(
        path.join(rootDir, '../seeders_data/notions', notion.filename),
        'utf-8',
      )

      return {
        title: notion.title,
        slug: notion.slug,
        description: notion.description,
        content,
        ...(notion.status && { status: notion.status }),
      }
    })

    // Create or update notions using idempotent operation
    await Notion.updateOrCreateMany('slug', notionsToCreate)
  }
}
