import fs from 'node:fs'
import path from 'node:path'
import Persona from '#models/persona'
import Simulateur from '#models/simulateur'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class PersonaSeeder extends BaseSeeder {
  async run() {
    // Check if personas already exist and delete them
    const personasCount = await Persona.query().count('* as total')

    if (personasCount[0].$extras.total > 0) {
      console.log('✓ Personas exist, deleting them before reseeding')
      await Persona.query().delete()
    }

    // Find the "demenagement-logement" simulateur
    const simulateur = await Simulateur.findBy('slug', 'demenagement-logement')

    if (!simulateur) {
      console.log('Simulateur "demenagement-logement" not found, skipping personas seeding')
      return
    }

    // Read the personas JSON file
    const rootDir = path.dirname(import.meta.dirname)
    const personasFilePath = path.join(rootDir, 'data', 'personas-demenagement-logement.json')

    let personasData: any[]
    try {
      if (!fs.existsSync(personasFilePath)) {
        console.log('Personas file not found at:', personasFilePath)
        return
      }

      const personasContent = fs.readFileSync(personasFilePath, 'utf-8')
      personasData = JSON.parse(personasContent)
    }
    catch (error) {
      console.log('Error reading or parsing personas file:', error)
      return
    }

    // Validate that it's an array
    if (!Array.isArray(personasData)) {
      console.log('Personas file does not contain a valid array')
      return
    }

    // Create personas
    const createdPersonas = []
    for (const personaData of personasData) {
      if (personaData.status === 'active') {
        const persona = await Persona.create({
          name: personaData.name,
          description: personaData.description,
          simulateurId: simulateur.id,
          status: personaData.status || 'active',
          testData: personaData.test_data, // Use test_data from JSON file
        })
        createdPersonas.push(persona)
      }
    }

    console.log(`✓ Created ${createdPersonas.length} personas for simulateur "${simulateur.title}"`)
  }
}
