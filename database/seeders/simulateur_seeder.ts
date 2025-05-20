import Simulateur from '#models/simulateur'
import SimulateurService from '#services/simulateur_service'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class SimulateurSeeder extends BaseSeeder {
  async run() {
    // Créer un service de simulateur pour générer le builtJson
    const simulateurService = new SimulateurService()

    // Créer le simulateur principal
    const simulateur = await Simulateur.create({
      slug: 'demenagement-logement',
      title: 'Aides financières au déménagement et au logement',
      description:
        'Répondez à ces questions pour découvrir les aides au logement et déménagement auxquelles vous pourriez être éligible',
      shortTitle: 'Logement',
      pictogramPath: '/artworks/custom-pictograms/demenagement.svg',
      status: 'published',
    })

    // Étape 1: Profil
    const profilStep = await simulateur.related('steps').create({
      slug: 'profil',
      title: 'Votre profil',
    })

    // Questions de l'étape Profil
    const statutQuestion = await profilStep.related('questions').create({
      slug: 'statut-professionnel',
      title: 'Êtes-vous :',
      description: 'Sélectionnez votre situation actuelle',
      type: 'radio',
    })

    // Choix pour la question "statut-professionnel"
    await statutQuestion.related('choices').createMany([
      {
        slug: 'etudiant',
        title: 'En études ou en alternance',
        tooltip: 'Cette option concerne les personnes inscrites dans un établissement d\'enseignement supérieur ou secondaire',
      },
      { slug: 'actif', title: 'Salarié(e) ou Indépendant(e)' },
      {
        slug: 'chomeur',
        title: 'Inscrit(e) comme demandeur d\'emploi',
        tooltip: 'Vous devez être inscrit à Pôle Emploi pour accéder à certaines aides spécifiques',
      },
      { slug: 'retraite', title: 'Retraité(e)' },
      { slug: 'inactif', title: 'Autre' },
    ])

    // Ajouter la question âge
    await profilStep.related('questions').create({
      slug: 'date-naissance',
      title: 'Quelle est votre date de naissance ?',
      description:
        'Renseignez le jour, le mois et l\'année sous le format jj/mm/aaaa (exemple : 15/08/1995)',
      type: 'date',
    })

    // Ajouter la question handicap
    await profilStep.related('questions').create({
      slug: 'handicap',
      title: 'Avez-vous une reconnaissance administrative d\'une situation de handicap ?',
      type: 'boolean',
    })

    // Étape 2: Logement
    const logementStep = await simulateur.related('steps').create({
      slug: 'logement',
      title: 'Votre logement',
    })

    // Questions de l'étape Logement
    await logementStep.related('questions').create({
      slug: 'code-postal-nouvelle-ville',
      title: 'Dans quelle ville allez-vous résider ?',
      description:
        'Veuillez saisir le nom ou le code postal de la commune dans laquelle vous allez résider.',
      type: 'combobox',
    })

    const situationLogementQuestion = await logementStep.related('questions').create({
      slug: 'situation-logement',
      title: 'Serez-vous :',
      description: 'Sélectionnez votre situation à venir',
      type: 'radio',
    })

    // Choix pour la question "situation-logement"
    await situationLogementQuestion.related('choices').createMany([
      {
        slug: 'locataire',
        title: 'Locataire (figurant sur le bail, en foyer ou en résidence)',
        tooltip: 'Vous devez obligatoirement être signataire du bail de location pour accéder à la plupart des aides',
      },
      { slug: 'proprietaire', title: 'Propriétaire ou en location-accession' },
      {
        slug: 'heberge',
        title: 'Hébergé(e) chez vos parents, un particulier ou en logement de fonction',
        tooltip: 'Vous ne payez pas de loyer ou vous n\'êtes pas signataire du bail',
      },
      { slug: 'sans-domicile', title: 'Sans domicile stable' },
    ])

    // Ajouter la question type de logement
    const typeLogementQuestion = await logementStep.related('questions').create({
      slug: 'type-logement',
      title: 'Quel sera le type de logement ?',
      type: 'radio',
    })

    // Choix pour la question "type-logement"
    await typeLogementQuestion.related('choices').createMany([
      { slug: 'logement-non-meuble', title: 'Logement non meublé' },
      {
        slug: 'logement-meuble',
        title: 'Logement meublé',
        tooltip: 'Un logement meublé doit contenir tous les équipements nécessaires à la vie quotidienne',
      },
      {
        slug: 'logement-foyer',
        title: 'Foyer (résidence CROUS, etc.) ou logement conventionné',
        tooltip: 'Les résidences CROUS et autres logements conventionnés peuvent donner accès à des aides spécifiques',
      },
      { slug: 'logement-chambre', title: 'Chambre chez un particulier' },
    ])

    // Étape 3: Revenus
    const revenusStep = await simulateur.related('steps').create({
      slug: 'revenus',
      title: 'Vos revenus',
    })

    // Questions de l'étape Revenus
    const typeRevenusQuestion = await revenusStep.related('questions').create({
      slug: 'type-revenus',
      title:
        'Quels sont les types de revenus qui s\'appliquent à votre situation ? (plusieurs choix possibles)',
      description:
        'Sélectionnez tous les types de revenus que vous avez perçus dans les 12 derniers mois. Vous pourrez ensuite saisir les montants.',
      type: 'checkbox',
    })

    // Choix pour la question "type-revenus"
    await typeRevenusQuestion.related('choices').createMany([
      {
        slug: 'revenus-activite',
        title: 'Revenus d\'activité (salaires, primes)',
        tooltip: 'Incluez tous les revenus liés à votre activité professionnelle : salaires, primes, indemnités de fin de contrat, etc.',
      },
      {
        slug: 'revenus-chomage',
        title: 'Chômage',
        tooltip: 'ARE (Allocation d\'aide au Retour à l\'Emploi) ou ASS (Allocation de Solidarité Spécifique)',
      },
      {
        slug: 'revenus-bourses',
        title: 'Bourses',
        tooltip: 'Bourses sur critères sociaux, bourses au mérite, aides à la mobilité, etc.',
      },
      {
        slug: 'revenus-entreprise',
        title: 'Revenus professionnels non salariés',
        tooltip: 'Revenus d\'activité indépendante, micro-entreprise, profession libérale, etc.',
      },
      { slug: 'revenus-parents', title: 'Ressources des parents' },
      { slug: 'aucun-autres-revenus', title: 'Aucun autre revenu à déclarer' },
    ])

    // Générer le builtJson
    await simulateurService.generateBuiltJson(simulateur.id)

    console.log(
      `Simulateur "${simulateur.title}" créé avec succès (id: ${simulateur.id}, slug: ${simulateur.slug})`,
    )
  }
}
