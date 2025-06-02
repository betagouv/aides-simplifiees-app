import fs from 'node:fs'
import path from 'node:path'
import Aide from '#models/aide'
import TypeAide from '#models/type_aide'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class AideSeeder extends BaseSeeder {
  async run() {
    // Check if aides already exist and delete them
    const aidesCount = await Aide.query().count('* as total')

    if (aidesCount[0].$extras.total > 0) {
      console.log('✓ Aides exist, deleting them before reseeding')
      await Aide.query().delete()
    }

    const typeAideMap: Record<string, TypeAide> = {}
    async function getTypeAide(slug: string): Promise<TypeAide | null> {
      if (typeAideMap[slug]) {
        return typeAideMap[slug]
      }
      const typeAide = await TypeAide.query().where('slug', slug).first()
      if (typeAide) {
        typeAideMap[slug] = typeAide
      }
      return typeAide
    }

    async function createAide({ typeAideSlug, ...options }: Record<string, any>): Promise<void> {
      const contentPromise = fs.promises.readFile(
        path.join(import.meta.dirname, `content/aides/${options.slug}.md`),
        { encoding: 'utf-8' },
      )
      const typeAidePromise = getTypeAide(typeAideSlug)
      await Promise.all([contentPromise, typeAidePromise])
        .then(([content, typeAide]) => {
          Aide.create({
            content,
            typeAideId: typeAide?.id,
            ...options,
          })
        })
    }

    // Create aides
    const aides = [
      {
        title: 'Aide Personnalisée au Logement (APL)',
        slug: 'aide-personnalisee-logement',
        typeAideSlug: 'aide-financiere',
        usage: 'loyer-logement',
        status: 'published',
        instructeur: 'CAF ou MSA',
        description: 'Aide financière pour réduire le montant du loyer ou des mensualités d\'emprunt',
        textesLoi: [
          {
            label: 'Code de la construction et de l\'habitation : articles R831-1 à R831-3',
            url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074096/LEGISCTA000038850380/#LEGISCTA000038878778',
          },
          {
            label: 'Code de la construction et de l\'habitation : articles R832-23 à D832-28',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878716',
          },
          {
            label: 'Code de la construction et de l\'habitation : articles R822-3 à R822-17',
            url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074096/LEGISCTA000038850156/#LEGISCTA000038879003',
          },
          {
            label: 'Code de la construction et de l\'habitation : articles D832-1 à D832-4',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878768',
          },
          {
            label: 'Code de la construction et de l\'habitation : articles R822-23 à R822-25',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878951/',
          },
          {
            label: 'Code de la construction et de l\'habitation : articles R823-1 à D823-9',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878941',
          },
          {
            label: 'Code de la construction et de l\'habitation : articles R823-10 à D823-15',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878921',
          },
        ],
      },
      {
        title: 'Garantie Visale',
        slug: 'garantie-visale',
        typeAideSlug: 'garantie',
        status: 'published',
        usage: 'caution-logement',
        instructeur: 'Action logement',
        description: 'Caution locative gratuite qui couvre les loyers impayés',
        textesLoi: [],
      },
      {
        title: 'Avance Loca-Pass',
        slug: 'locapass',
        typeAideSlug: 'pret',
        status: 'published',
        usage: 'pret-garantie-logement',
        instructeur: 'Action logement',
        description: 'Prêt à 0% pour financer votre dépôt de garantie',
        textesLoi: [],
      },
      {
        title: 'Aide à la mobilité master',
        slug: 'mobilite-master-1',
        typeAideSlug: 'aide-financiere',
        status: 'published',
        usage: 'frais-installation-logement',
        instructeur: 'Ministère chargé de l\'enseignement supérieur, de la recherche et de l\'innovation',
        description: 'Aide financière pour les étudiants boursiers qui changent de région pour leur première année de master',
        textesLoi: [
          {
            label:
              'Décret n° 2017-969 du 10 mai 2017 relatif à l\'aide à la mobilité accordée aux étudiants inscrits en première année du diplôme national de master',
            url: '',
          },
        ],
      },
      {
        title: 'Aide à la mobilité Parcoursup',
        slug: 'mobilite-parcoursup',
        typeAideSlug: 'aide-financiere',
        usage: 'frais-installation-logement',
        status: 'published',
        instructeur: 'Ministère chargé de l\'enseignement supérieur, de la recherche et de l\'innovation',
        description: 'Aide financière pour les lycéens boursiers qui s\'inscrivent dans une formation située hors de leur académie',
        textesLoi: [],
      },
      {
        title: 'Fonds de Solidarité pour le Logement (FSL)',
        slug: 'fond-solidarite-logement',
        status: 'published',
        typeAideSlug: 'aide-financiere',
        usage: 'loyer-logement',
        instructeur: 'Conseil départemental',
        description: 'Aide financière pour l\'accès ou le maintien dans le logement',
        textesLoi: [],
      },
    ]

    await aides.map(createAide)
  }
}
