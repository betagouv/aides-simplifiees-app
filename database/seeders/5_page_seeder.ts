import fs from 'node:fs'
import path from 'node:path'
import Page from '#models/page'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class PageSeeder extends BaseSeeder {
  async run() {
    // Check if pages already exist and delete them
    const pagesCount = await Page.query().count('* as total')

    if (pagesCount[0].$extras.total > 0) {
      console.log('✓ Pages exist, deleting them before reseeding')
      await Page.query().delete()
    }

    const rootDir = import.meta.dirname

    // Lecture des fichiers markdown
    const accessibiliteContent = fs.readFileSync(
      path.join(rootDir, 'content/pages/accessibilite.md'),
      'utf-8',
    )

    const donneesPersonnellesContent = fs.readFileSync(
      path.join(rootDir, 'content/pages/donnees-personnelles.md'),
      'utf-8',
    )

    const cguContent = fs.readFileSync(path.join(rootDir, 'content/pages/cgu.md'), 'utf-8')

    const mentionsLegalesContent = fs.readFileSync(
      path.join(rootDir, 'content/pages/mentions-legales.md'),
      'utf-8',
    )

    const aproposContent = fs.readFileSync(path.join(rootDir, 'content/pages/apropos.md'), 'utf-8')

    const cookiesContent = fs.readFileSync(path.join(rootDir, 'content/pages/cookies.md'), 'utf-8')

    // Create sample pages
    await Page.createMany([
      {
        title: 'Accessibilité',
        slug: 'accessibilite',
        content: accessibiliteContent,
        metaDescription: 'Informations sur l\'accessibilité de la plateforme Aides Simplifiées',
      },
      {
        title: 'Politique de confidentialité et données personnelles',
        slug: 'donnees-personnelles',
        content: donneesPersonnellesContent,
        metaDescription:
          'Notre politique de confidentialité et le traitement des données personnelles',
      },
      {
        title: 'Conditions Générales d\'Utilisation',
        slug: 'cgu',
        content: cguContent,
        metaDescription:
          'Les conditions générales d\'utilisation de la plateforme Aides Simplifiées',
      },
      {
        title: 'Mentions légales',
        slug: 'mentions-legales',
        content: mentionsLegalesContent,
        metaDescription: 'Mentions légales de la plateforme Aides Simplifiées',
      },
      {
        title: 'À propos',
        slug: 'a-propos',
        content: aproposContent,
        metaDescription: 'En savoir plus sur la plateforme Aides Simplifiées',
      },
      {
        title: 'Cookies',
        slug: 'cookies',
        content: cookiesContent,
        metaDescription: 'Notre politique concernant les cookies',
      },
      {
        title: 'Accueil',
        slug: 'accueil',
        content: `
# Bienvenue sur Aides Simplifiées

Découvrez notre plateforme dédiée à la simplification des aides publiques.
        `,
        metaDescription: 'Plateforme de simplification des aides publiques',
      },
    ])

    console.log('✓ Pages created from markdown files')
  }
}
