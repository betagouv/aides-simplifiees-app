import Persona from '#models/persona'
import Simulateur from '#models/simulateur'
import { test } from '@japa/runner'

test.group('Persona Management', (group) => {
  group.each.setup(async () => {
    // Clean up data before each test
    await Persona.query().delete()
    await Simulateur.query().delete()
  })

  group.each.teardown(async () => {
    // Clean up data after each test
    await Persona.query().delete()
    await Simulateur.query().delete()
  })

  test('can create a persona for a simulateur', async ({ assert }) => {
    // Create a test simulateur
    const simulateur = await Simulateur.create({
      title: 'Test Simulateur',
      slug: 'test-simulateur-persona-test',
      description: 'A test simulateur',
      status: 'published',
    })

    // Create a persona
    const persona = await Persona.create({
      simulateurId: simulateur.id,
      name: 'Test Persona',
      description: 'A test persona',
      testData: { age: 25, income: 1500 },
      status: 'active',
    })

    assert.equal(persona.name, 'Test Persona')
    assert.equal(persona.simulateurId, simulateur.id)
    assert.deepEqual(persona.testData, { age: 25, income: 1500 })
  })

  test('can load personas for a simulateur', async ({ assert }) => {
    // Create a test simulateur
    const simulateur = await Simulateur.create({
      title: 'Test Simulateur 2',
      slug: 'test-simulateur-2-persona-test',
      description: 'Another test simulateur',
      status: 'published',
    })

    // Create multiple personas
    await Persona.createMany([
      {
        simulateurId: simulateur.id,
        name: 'Persona 1',
        description: 'First persona',
        testData: { age: 20 },
        status: 'active',
      },
      {
        simulateurId: simulateur.id,
        name: 'Persona 2',
        description: 'Second persona',
        testData: { age: 30 },
        status: 'inactive',
      },
    ])

    // Load personas for the simulateur
    await simulateur.load('personas', (query) => {
      query.orderBy('id')
    })

    assert.equal(simulateur.personas.length, 2)
    assert.equal(simulateur.personas[0].name, 'Persona 1')
    assert.equal(simulateur.personas[1].name, 'Persona 2')
  })

  test('persona test data is properly serialized', async ({ assert }) => {
    const simulateur = await Simulateur.create({
      title: 'Test Simulateur 3',
      slug: 'test-simulateur-3-persona-test',
      description: 'Test serialization',
      status: 'published',
    })

    const complexTestData = {
      personal: {
        age: 25,
        name: 'John Doe',
      },
      financial: {
        income: 2000,
        savings: 5000,
      },
      family: ['spouse', 'child1', 'child2'],
    }

    const persona = await Persona.create({
      simulateurId: simulateur.id,
      name: 'Complex Data Persona',
      description: 'Testing complex data serialization',
      testData: complexTestData,
      status: 'active',
    })

    // Reload from database to test serialization
    const reloadedPersona = await Persona.find(persona.id)

    assert.deepEqual(reloadedPersona!.testData, complexTestData)
  })
})
