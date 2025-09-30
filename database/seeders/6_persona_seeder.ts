import fs from 'node:fs'
import path from 'node:path'
import Persona from '#models/persona'
import Simulateur from '#models/simulateur'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class PersonaSeeder extends BaseSeeder {
  async run() {
    // Find the "demenagement-logement" simulateur
    const simulateur = await Simulateur.findBy('slug', 'demenagement-logement')

    if (!simulateur) {
      console.log('Simulateur "demenagement-logement" not found, skipping personas seeding')
      return
    }

    // Read the personas JSON file
    const rootDir = path.dirname(new URL(import.meta.url).pathname)
    const personasFilePath = path.join(rootDir, '../seeders_data/personas', 'personas-demenagement-logement.json')

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

    // Create or update personas using idempotent operation
    const activePersonas = personasData.filter(persona => persona.status === 'active')

    if (activePersonas.length > 0) {
      // We'll use updateOrCreate for each persona individually since they need dynamic data
      for (const personaData of activePersonas) {
        await Persona.updateOrCreate(
          { name: personaData.name, simulateurId: simulateur.id }, // unique key combination
          {
            name: personaData.name,
            description: personaData.description,
            simulateurId: simulateur.id,
            status: personaData.status || 'active',
            testData: personaData.test_data, // Use test_data from JSON file
          },
        )
      }
    }
    else {
      console.log('No active personas found in the data file')
    }
  }
}
