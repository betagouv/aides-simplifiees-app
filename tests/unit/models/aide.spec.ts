import Aide from '#models/aide'
import { AideFactory } from '#tests/fixtures/aide_factory'
import { TypeAideFactory } from '#tests/fixtures/type_aide_factory'
import { test } from '@japa/runner'

test.group('Aide Model', (group) => {
  group.each.setup(async () => {
    await AideFactory.cleanup()
    await TypeAideFactory.cleanup()
  })

  group.each.teardown(async () => {
    await AideFactory.cleanup()
    await TypeAideFactory.cleanup()
  })

  test('should create an aide with required fields', async ({ assert }) => {
    const aide = await AideFactory.createAide({
      slug: 'test-create',
      title: 'Test Creation',
    })

    assert.isOk(aide)
    assert.equal(aide.slug, 'test-create')
    assert.equal(aide.title, 'Test Creation')
    assert.equal(aide.status, 'draft')
    assert.isOk(aide.createdAt)
    assert.isOk(aide.updatedAt)
  })

  test('should accept all valid status values', async ({ assert }) => {
    const statuses = ['draft', 'published', 'unlisted'] as const

    for (const status of statuses) {
      const aide = await Aide.create({
        slug: `status-test-${status}`,
        title: `Status Test ${status}`,
        status,
      })

      assert.equal(aide.status, status)
    }
  })

  test('should create aide with typeAide relationship', async ({ assert }) => {
    // Create multiple TypeAide records
    await TypeAideFactory.createMultipleTypesAide()

    const typeAideSlugs = ['aide-financiere', 'pret', 'garantie']

    for (const typeAideSlug of typeAideSlugs) {
      const aide = await AideFactory.createAide({
        slug: `type-test-${typeAideSlug}`,
        title: `Type Test ${typeAideSlug}`,
        typeAideSlug,
      })

      // Load the relationship to verify it's properly set
      await aide.load('typeAide')

      assert.isOk(aide.typeAide)
      assert.equal(aide.typeAide.slug, typeAideSlug)
      assert.isNumber(aide.typeAideId)
    }
  })

  test('should accept all valid usage values', async ({ assert }) => {
    const usages: UsageAide[] = [
      'loyer-logement',
      'frais-installation-logement',
      'caution-logement',
      'pret-garantie-logement',
      'credit-impot',
      'jeune-entreprise',
    ]

    for (const usage of usages) {
      const aide = await Aide.create({
        slug: `usage-test-${usage}`,
        title: `Usage Test ${usage}`,
        usage,
      })

      assert.equal(aide.usage, usage)
    }
  })

  test('should enforce unique slug constraint', async ({ assert }) => {
    await AideFactory.createAide({
      slug: 'unique-slug',
      title: 'First Aide',
    })

    try {
      await AideFactory.createAide({
        slug: 'unique-slug',
        title: 'Second Aide',
      })
      assert.fail('Should have thrown an error for duplicate slug')
    }
    catch (error) {
      assert.isOk(error)
    }
  })

  test('should handle textesLoi JSON serialization', async ({ assert }) => {
    const textesLoi: TexteLoi[] = [
      { label: 'Article L123-1', url: 'https://legifrance.gouv.fr/article1' },
      { label: 'Article L123-2', url: 'https://legifrance.gouv.fr/article2' },
    ]

    const aide = await Aide.create({
      slug: 'json-test',
      title: 'JSON Test',
      textesLoi,
    })

    assert.deepEqual(aide.textesLoi, textesLoi)

    // Test retrieval
    const retrieved = await Aide.findOrFail(aide.id)
    assert.deepEqual(retrieved.textesLoi, textesLoi)
    assert.equal(retrieved.textesLoi[0].label, 'Article L123-1')
    assert.equal(retrieved.textesLoi[1].url, 'https://legifrance.gouv.fr/article2')
  })

  test('should handle empty textesLoi array', async ({ assert }) => {
    const aide = await Aide.create({
      slug: 'empty-textes-test',
      title: 'Empty Textes Test',
      textesLoi: [],
    })

    assert.deepEqual(aide.textesLoi, [])
  })

  test('should filter aides by typeAide relationship and usage', async ({ assert }) => {
    await AideFactory.createMultipleAides()

    // Query with relationship join
    const prets = await Aide.query()
      .preload('typeAide')
      .whereHas('typeAide', (query) => {
        query.where('slug', 'pret')
      })

    const aideFinancieres = await Aide.query()
      .preload('typeAide')
      .whereHas('typeAide', (query) => {
        query.where('slug', 'aide-financiere')
      })

    const cautionLogement = await Aide.query().where('usage', 'caution-logement')

    assert.equal(prets.length, 1)
    assert.equal(prets[0].typeAide.slug, 'pret')
    assert.equal(aideFinancieres.length, 1)
    assert.equal(aideFinancieres[0].typeAide.slug, 'aide-financiere')
    assert.equal(cautionLogement.length, 1)
  })

  test('should find aide by slug', async ({ assert }) => {
    await AideFactory.createAide({
      slug: 'findable-slug',
      title: 'Findable Aide',
    })

    const found = await Aide.findBy('slug', 'findable-slug')
    assert.isOk(found)
    assert.equal(found!.slug, 'findable-slug')
  })

  test('should handle null optional fields', async ({ assert }) => {
    // Create a TypeAide record first since typeAideId is required
    const typeAide = await TypeAideFactory.createTypeAide()

    const aide = await Aide.create({
      slug: 'null-test',
      title: 'Null Test',
      description: null,
      metaDescription: null,
      content: null,
      typeAideId: typeAide.id,
      usage: null,
      instructeur: null,
      textesLoi: [],
    })

    assert.isNull(aide.description)
    assert.isNull(aide.metaDescription)
    assert.isNull(aide.content)
    assert.isNumber(aide.typeAideId)
    assert.isNull(aide.usage)
    assert.isNull(aide.instructeur)
    assert.deepEqual(aide.textesLoi, [])
  })
})
