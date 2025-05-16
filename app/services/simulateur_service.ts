import type { ModelObject } from '@adonisjs/lucid/types/model'
import Simulateur from '#models/simulateur'

export default class SimulateurService {
  /**
   * Generates and updates the built_json field for a Simulateur
   * This creates a structured JSON representation of the simulateur with all its steps, questions, and choices
   */
  public async generateBuiltJson(simulateurId: number): Promise<string> {
    // Load the simulateur with all related data
    const simulateur = await Simulateur.query()
      .where('id', simulateurId)
      .preload('steps', (stepsQuery) => {
        stepsQuery.orderBy('id').preload('questions', (questionsQuery) => {
          questionsQuery.orderBy('id').preload('choices', (choicesQuery) => {
            choicesQuery.orderBy('id')
          })
        })
      })
      .firstOrFail()

    // Create the base simulateur object
    const simulateurJson: any = {
      version: '2.0.0',
      forceRefresh: false,
      id: simulateur.slug,
      title: simulateur.title,
      description: simulateur.description,
      steps: [],
    }

    // Add steps
    for (const step of simulateur.steps) {
      const stepJson: any = {
        id: step.slug,
        title: step.title,
        questions: [],
      }

      // Add questions for each step
      for (const question of step.questions) {
        const questionJson: any = {
          id: question.slug,
          title: question.title,
          type: question.type,
        }

        // Add description if available
        if (question.description) {
          questionJson.description = question.description
        }

        // Add choices for question types that need them (radio, checkbox, etc.)
        if (['radio', 'checkbox', 'select'].includes(question.type)) {
          questionJson.choices = question.choices.map((choice) => {
            const choiceObj: any = {
              id: choice.slug,
              title: choice.title,
            }

            // Add tooltip if available
            if (choice.tooltip) {
              choiceObj.tooltip = choice.tooltip
            }

            return choiceObj
          })
        }

        // Add the question to the step
        stepJson.questions.push(questionJson)
      }

      // Add the step to the simulateur
      simulateurJson.steps.push(stepJson)
    }

    // Convert to JSON string
    const builtJson = JSON.stringify(simulateurJson, null, 2)

    // Update the simulateur with the new builtJson
    await simulateur.merge({ builtJson }).save()

    return builtJson
  }

  /**
   * Creates a complete simulateur from sample data (mainly for testing)
   */
  public async createSampleSimulateur(): Promise<ModelObject> {
    const simulateur = await Simulateur.create({
      slug: 'logement-mobilite',
      title: 'Logement et mobilité',
      description: 'Découvrez les aides disponibles pour votre logement et votre mobilité',
      shortTitle: 'Logement',
      pictogramPath: '/icons/logement.svg',
      status: 'draft',
    })

    // Create first step
    const step1 = await simulateur.related('steps').create({
      slug: 'profil',
      title: 'Votre profil',
    })

    // Create questions for first step
    const question1 = await step1.related('questions').create({
      slug: 'statut-professionnel',
      title: 'Êtes-vous :',
      description: 'Sélectionnez votre situation actuelle',
      type: 'radio',
    })

    // Create choices for question 1
    await question1.related('choices').createMany([
      {
        slug: 'etudiant',
        title: 'En études ou en alternance',
        tooltip: 'Cette option concerne les personnes inscrites dans un établissement d\'enseignement',
      },
      {
        slug: 'actif',
        title: 'Salarié(e) ou Indépendant(e)',
      },
      {
        slug: 'chomeur',
        title: 'Inscrit(e) comme demandeur d\'emploi',
        tooltip: 'Vous devez être inscrit à Pôle Emploi',
      },
      { slug: 'retraite', title: 'Retraité(e)' },
      { slug: 'inactif', title: 'Autre' },
    ])

    // Create second step
    const step2 = await simulateur.related('steps').create({
      slug: 'logement',
      title: 'Votre logement',
    })

    // Create a question for second step
    const question2 = await step2.related('questions').create({
      slug: 'situation-logement',
      title: 'Serez-vous :',
      description: 'Sélectionnez votre situation à venir',
      type: 'radio',
    })

    // Create choices for question 2
    await question2.related('choices').createMany([
      {
        slug: 'locataire',
        title: 'Locataire (figurant sur le bail, en foyer ou en résidence)',
        tooltip: 'Vous devez obligatoirement être signataire du bail de location',
      },
      {
        slug: 'proprietaire',
        title: 'Propriétaire ou en location-accession',
      },
      {
        slug: 'heberge',
        title: 'Hébergé(e) chez vos parents, un particulier ou en logement de fonction',
        tooltip: 'Vous ne payez pas de loyer ou vous n\'êtes pas signataire du bail',
      },
      { slug: 'sans-domicile', title: 'Sans domicile stable' },
    ])

    // Generate the built JSON
    await this.generateBuiltJson(simulateur.id)

    // Return the updated simulateur
    return await Simulateur.findOrFail(simulateur.id)
  }
}
