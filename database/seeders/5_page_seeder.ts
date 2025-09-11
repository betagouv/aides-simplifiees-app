import fs from 'node:fs'
import path from 'node:path'
import Page from '#models/page'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class PageSeeder extends BaseSeeder {
  async run() {
    const rootDir = path.dirname(new URL(import.meta.url).pathname)

    // Define page data with their file paths and metadata
    const pageData = [
      {
        title: 'Accessibilité',
        slug: 'accessibilite',
        filename: 'accessibilite.md',
        metaDescription: 'Informations sur l\'accessibilité de la plateforme Aides Simplifiées',
        status: 'published' as const,
      },
      {
        title: 'Politique de confidentialité et données personnelles',
        slug: 'donnees-personnelles',
        filename: 'donnees-personnelles.md',
        metaDescription:
          'Notre politique de confidentialité et le traitement des données personnelles',
        status: 'published' as const,
      },
      {
        title: 'Conditions Générales d\'Utilisation',
        slug: 'cgu',
        filename: 'cgu.md',
        metaDescription:
          'Les conditions générales d\'utilisation de la plateforme Aides Simplifiées',
        status: 'published' as const,
      },
      {
        title: 'Mentions légales',
        slug: 'mentions-legales',
        filename: 'mentions-legales.md',
        metaDescription: 'Mentions légales de la plateforme Aides Simplifiées',
        status: 'published' as const,
      },
      {
        title: 'À propos',
        slug: 'a-propos',
        filename: 'apropos.md',
        metaDescription: 'En savoir plus sur la plateforme Aides Simplifiées',
        status: 'published' as const,
      },
      {
        title: 'Cookies',
        slug: 'cookies',
        filename: 'cookies.md',
        metaDescription: 'Notre politique concernant les cookies',
        status: 'published' as const,
      },
    ]

    // Read content files and prepare data for insertion
    const pagesToCreate = pageData.map((page) => {
      const content = fs.readFileSync(
        path.join(rootDir, 'data/pages', page.filename),
        'utf-8',
      )

      return {
        title: page.title,
        slug: page.slug,
        content,
        metaDescription: page.metaDescription,
        status: page.status,
      }
    })

    // Create or update pages using idempotent operation
    await Page.updateOrCreateMany('slug', pagesToCreate)
  }
}
