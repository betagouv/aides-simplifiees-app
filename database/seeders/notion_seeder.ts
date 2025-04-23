import fs from 'node:fs'
import path from 'node:path'
import Notion from '#models/notion'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class NotionSeeder extends BaseSeeder {
  async run() {
    // Check if notions already exist and delete them
    const notionsCount = await Notion.query().count('* as total')

    if (notionsCount[0].$extras.total > 0) {
      console.log('✓ Notions exist, deleting them before reseeding')
      await Notion.query().delete()
    }

    const rootDir = import.meta.dirname

    // Lecture des fichiers markdown
    const handicapContent = fs.readFileSync(
      path.join(rootDir, 'content/notions/handicap.md'),
      'utf-8',
    )
    const montantCaMicroEntrepriseContent = fs.readFileSync(
      path.join(rootDir, 'content/notions/montant-ca-micro-entreprise.md'),
      'utf-8',
    )
    const montantChomageContent = fs.readFileSync(
      path.join(rootDir, 'content/notions/montant-chomage.md'),
      'utf-8',
    )
    const montantParentsContent = fs.readFileSync(
      path.join(rootDir, 'content/notions/montant-parents.md'),
      'utf-8',
    )
    const logementConventionneContent = fs.readFileSync(
      path.join(rootDir, 'content/notions/logement-conventionne.md'),
      'utf-8',
    )
    const loyerMontantChargesContent = fs.readFileSync(
      path.join(rootDir, 'content/notions/loyer-montant-charges.md'),
      'utf-8',
    )
    const salaireImposableContent = fs.readFileSync(
      path.join(rootDir, 'content/notions/salaire-imposable.md'),
      'utf-8',
    )

    // Create sample notions
    await Notion.createMany([
      {
        title: 'Avez-vous une reconnaissance administrative de votre situation de handicap ?',
        slug: 'handicap',
        description:
          'Pour bénéficier de certaines aides financières, il est nécessaire de disposer d\'une reconnaissance administrative de votre situation de handicap.',
        content: handicapContent,
        category: 'definitions',
      },
      {
        title: 'En savoir plus sur le chiffre d\'affaires généré via une micro-entreprise',
        slug: 'montant-ca-micro-entreprise',
        description: 'Connaître les règles de calcul applicables',
        content: montantCaMicroEntrepriseContent,
        category: 'calcul',
      },
      {
        title: 'En savoir plus sur les allocations chômage perçues au cours des 12 derniers mois',
        slug: 'montant-chomage',
        description: 'Connaître les règles de calcul applicables',
        content: montantChomageContent,
        category: 'calcul',
      },
      {
        title: 'En savoir plus sur les ressources des parents au cours des 12 derniers mois',
        slug: 'montant-parents',
        description: 'Connaître les règles de calcul applicables',
        content: montantParentsContent,
        category: 'calcul',
      },
      {
        title:
          'Comment savoir si mon logement est conventionné pour l\'Aide Personnalisée au Logement (APL) ?',
        slug: 'logement-conventionne',
        description: 'Informations sur la convention APL',
        content: logementConventionneContent,
        category: 'logement',
      },
      {
        title: 'Précisions sur le calcul du montant des charges locatives',
        slug: 'loyer-montant-charges',
        description:
          'Les charges locatives sont des dépenses liées à l\'entretien et au fonctionnement de votre logement.',
        content: loyerMontantChargesContent,
        category: 'logement',
      },
      {
        title: 'Comment connaître votre revenu imposable sur les 12 derniers mois ?',
        slug: 'salaire-imposable',
        description:
          'Pour bénéficier de certaines aides financières, il est nécessaire de déclarer votre revenu imposable sur les 12 derniers mois.',
        content: salaireImposableContent,
        category: 'revenus',
      },
    ])

    console.log('✓ Notions created from markdown files')
  }
}
