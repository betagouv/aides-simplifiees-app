import fs from 'node:fs'
import path from 'node:path'
import Aide from '#models/aide'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class AideSeeder extends BaseSeeder {
  async run() {
    // Check if aides already exist and delete them
    const aidesCount = await Aide.query().count('* as total')

    if (aidesCount[0].$extras.total > 0) {
      console.log('✓ Aides exist, deleting them before reseeding')
      await Aide.query().delete()
    }

    const rootDir = import.meta.dirname

    // Lecture des fichiers markdown
    const aidePersonnaliseeLogementContent = fs.readFileSync(
      path.join(rootDir, 'content/aides/aide-personnalisee-logement.md'),
      'utf-8',
    )

    const garantieVisaleContent = fs.readFileSync(
      path.join(rootDir, 'content/aides/garantie-visale.md'),
      'utf-8',
    )

    const locapassContent = fs.readFileSync(
      path.join(rootDir, 'content/aides/locapass.md'),
      'utf-8',
    )

    const mobiliteMaster1Content = fs.readFileSync(
      path.join(rootDir, 'content/aides/mobilite-master-1.md'),
      'utf-8',
    )

    const mobiliteParcoursupContent = fs.readFileSync(
      path.join(rootDir, 'content/aides/mobilite-parcoursup.md'),
      'utf-8',
    )

    const fondSolidariteLogementContent = fs.readFileSync(
      path.join(rootDir, 'content/aides/fond-solidarite-logement.md'),
      'utf-8',
    )

    // Create aides
    await Aide.createMany([
      {
        title: 'Aide Personnalisée au Logement (APL)',
        slug: 'aide-personnalisee-logement',
        type: 'aide-financiere',
        usage: 'loyer-logement',
        instructeur: 'CAF ou MSA',
        description:
          'Aide financière pour réduire le montant du loyer ou des mensualités d\'emprunt',
        textesLoi: [
          {
            prefix: 'Conditions générales d\'attribution',
            label: 'Code de la construction et de l\'habitation : articles R831-1 à R831-3',
            url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074096/LEGISCTA000038850380/#LEGISCTA000038878778',
          },
          {
            prefix: 'Foyer',
            label: 'Code de la construction et de l\'habitation : articles R832-23 à D832-28',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878716',
          },
          {
            prefix: 'Conditions de ressources',
            label: 'Code de la construction et de l\'habitation : articles R822-3 à R822-17',
            url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074096/LEGISCTA000038850156/#LEGISCTA000038879003',
          },
          {
            prefix: 'Versement en tiers payant',
            label: 'Code de la construction et de l\'habitation : articles D832-1 à D832-4',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878768',
          },
          {
            prefix: 'Conditions liées au logement',
            label: 'Code de la construction et de l\'habitation : articles R822-23 à R822-25',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878951/',
          },
          {
            prefix: 'Calcul et versement des aides',
            label: 'Code de la construction et de l\'habitation : articles R823-1 à D823-9',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878941',
          },
          {
            prefix: 'Ouverture et extinction des droits',
            label: 'Code de la construction et de l\'habitation : articles R823-10 à D823-15',
            url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038878921',
          },
        ],
        content: aidePersonnaliseeLogementContent,
      },
      {
        title: 'Garantie Visale',
        slug: 'garantie-visale',
        type: 'garantie',
        usage: 'caution-logement',
        instructeur: 'Action logement',
        description: 'Caution locative gratuite qui couvre les loyers impayés',
        textesLoi: [],
        content: garantieVisaleContent,
      },
      {
        title: 'Avance Loca-Pass',
        slug: 'locapass',
        type: 'avance',
        usage: 'pret-garantie-logement',
        instructeur: 'Action logement',
        description: 'Prêt à 0% pour financer votre dépôt de garantie',
        textesLoi: [],
        content: locapassContent,
      },
      {
        title: 'Aide à la mobilité master',
        slug: 'mobilite-master-1',
        type: 'aide-financiere',
        usage: 'frais-installation-logement',
        instructeur:
          'Ministère chargé de l\'enseignement supérieur, de la recherche et de l\'innovation',
        description:
          'Aide financière pour les étudiants boursiers qui changent de région pour leur première année de master',
        textesLoi: [
          {
            prefix: '',
            label:
              'Décret n° 2017-969 du 10 mai 2017 relatif à l\'aide à la mobilité accordée aux étudiants inscrits en première année du diplôme national de master',
            url: '',
          },
        ],
        content: mobiliteMaster1Content,
      },
      {
        title: 'Aide à la mobilité Parcoursup',
        slug: 'mobilite-parcoursup',
        type: 'aide-financiere',
        usage: 'frais-installation-logement',
        instructeur:
          'Ministère chargé de l\'enseignement supérieur, de la recherche et de l\'innovation',
        description:
          'Aide financière pour les lycéens boursiers qui s\'inscrivent dans une formation située hors de leur académie',
        textesLoi: [],
        content: mobiliteParcoursupContent,
      },
      {
        title: 'Fonds de Solidarité pour le Logement (FSL)',
        slug: 'fond-solidarite-logement',
        type: 'aide-financiere',
        usage: 'loyer-logement',
        instructeur: 'Conseil départemental',
        description: 'Aide financière pour l\'accès ou le maintien dans le logement',
        textesLoi: [],
        content: fondSolidariteLogementContent,
      },
    ])

    console.log('✓ Aides created from markdown files')
  }
}
