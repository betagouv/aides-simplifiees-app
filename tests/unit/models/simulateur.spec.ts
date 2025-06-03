import Simulateur from '#models/simulateur'
import { SimulateurFactory } from '#tests/fixtures/simulateur_factory'
import { test } from '@japa/runner'

test.group('Simulateur Model', (group) => {
  group.each.setup(async () => {
    await SimulateurFactory.cleanup()
  })

  group.each.teardown(async () => {
    await SimulateurFactory.cleanup()
  })

  test('should create a simulateur with required fields', async ({ assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'test-create',
      title: 'Test Creation',
    })

    assert.isOk(simulateur)
    assert.equal(simulateur.slug, 'test-create')
    assert.equal(simulateur.title, 'Test Creation')
    assert.equal(simulateur.status, 'draft')
    assert.isOk(simulateur.createdAt)
    assert.isOk(simulateur.updatedAt)
  })

  test('should validate required fields', async ({ assert }) => {
    try {
      await Simulateur.create({})
      assert.fail('Should have thrown an error')
    }
    catch (error) {
      assert.isOk(error)
    }
  })

  test('should set default status to draft', async ({ assert }) => {
    const simulateur = await Simulateur.create({
      slug: 'default-status-test',
      title: 'Default Status Test',
      pictogramPath: '/test.svg',
    })
    assert.equal(simulateur.status, 'draft')
  })

  test('should accept all valid status values', async ({ assert }) => {
    const statuses = ['draft', 'published', 'unlisted'] as const

    for (const status of statuses) {
      const simulateur = await Simulateur.create({
        slug: `status-test-${status}`,
        title: `Status Test ${status}`,
        pictogramPath: '/test.svg',
        status,
      })

      assert.equal(simulateur.status, status)
    }
  })

  test('should allow null description and metaDescription', async ({ assert }) => {
    const simulateur = await Simulateur.create({
      slug: 'null-test',
      title: 'Null Test',
      pictogramPath: '/test.svg',
      description: null,
      metaDescription: null,
    })

    assert.isNull(simulateur.description)
    assert.isNull(simulateur.metaDescription)
  })

  test('should store and retrieve built JSON', async ({ assert }) => {
    const builtJson = JSON.stringify({ test: 'data' })
    const simulateur = await Simulateur.create({
      slug: 'json-test',
      title: 'JSON Test',
      pictogramPath: '/test.svg',
      builtJson,
    })

    assert.equal(simulateur.builtJson, builtJson)

    // Test retrieval
    const retrieved = await Simulateur.findOrFail(simulateur.id)
    assert.equal(retrieved.builtJson, builtJson)
  })

  test('should filter by status', async ({ assert }) => {
    await SimulateurFactory.createMultipleSimulateurs()

    const published = await Simulateur.query().where('status', 'published')
    const drafts = await Simulateur.query().where('status', 'draft')

    assert.equal(published.length, 1)
    assert.equal(drafts.length, 1)
    assert.equal(published[0].status, 'published')
    assert.equal(drafts[0].status, 'draft')
  })

  test('should update simulateur fields', async ({ assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur()
    const originalUpdatedAt = simulateur.updatedAt

    // Wait a moment to ensure updatedAt changes
    await new Promise(resolve => setTimeout(resolve, 100))

    await simulateur.merge({
      title: 'Updated Title',
      status: 'published',
    }).save()

    assert.equal(simulateur.title, 'Updated Title')
    assert.equal(simulateur.status, 'published')
    assert.isAbove(simulateur.updatedAt.toMillis(), originalUpdatedAt.toMillis())
  })

  test('should delete simulateur', async ({ assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur()
    const id = simulateur.id

    await simulateur.delete()

    const found = await Simulateur.find(id)
    assert.isNull(found)
  })

  test('should find simulateur by slug', async ({ assert }) => {
    await SimulateurFactory.createSimulateur({
      slug: 'findable-slug',
      title: 'Findable Simulateur',
    })

    const found = await Simulateur.findBy('slug', 'findable-slug')
    assert.isOk(found)
    assert.equal(found!.slug, 'findable-slug')
  })

  // Essential Business Logic Tests
  test('should enforce unique slug constraint', async ({ assert }) => {
    await SimulateurFactory.createSimulateur({
      slug: 'unique-slug',
      title: 'First Simulateur',
    })

    try {
      await SimulateurFactory.createSimulateur({
        slug: 'unique-slug',
        title: 'Second Simulateur',
      })
      assert.fail('Should have thrown an error for duplicate slug')
    }
    catch (error) {
      assert.isOk(error)
    }
  })

  test('should handle complex JSON in builtJson field', async ({ assert }) => {
    const complexJson = JSON.stringify({
      version: '1.0',
      steps: [
        { id: 1, slug: 'profil', questions: ['age', 'status'] },
        { id: 2, slug: 'logement', questions: ['location', 'rent'] },
      ],
      metadata: {
        created: new Date().toISOString(),
        rules: { minAge: 18, maxRent: 1000 },
      },
    })

    const simulateur = await Simulateur.create({
      slug: 'complex-json-test',
      title: 'Complex JSON Test',
      pictogramPath: '/test.svg',
      builtJson: complexJson,
    })

    assert.equal(simulateur.builtJson, complexJson)

    // Verify JSON can be parsed back
    const parsedJson = JSON.parse(simulateur.builtJson)
    assert.property(parsedJson, 'version')
    assert.property(parsedJson, 'steps')
    assert.property(parsedJson, 'metadata')
    assert.equal(parsedJson.version, '1.0')
  })

  test('should filter simulateurs by multiple statuses', async ({ assert }) => {
    await SimulateurFactory.createMultipleSimulateurs()

    const publishedAndUnlisted = await Simulateur.query()
      .whereIn('status', ['published', 'unlisted'])
      .orderBy('status')

    assert.equal(publishedAndUnlisted.length, 2)
    assert.equal(publishedAndUnlisted[0].status, 'published')
    assert.equal(publishedAndUnlisted[1].status, 'unlisted')
  })
})
