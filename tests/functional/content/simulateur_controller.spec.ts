import { SimulateurFactory } from '#tests/fixtures/simulateur_factory'
import { test } from '@japa/runner'

test.group('SimulateurController', (group) => {
  group.each.setup(async () => {
    await SimulateurFactory.cleanup()
  })

  group.each.teardown(async () => {
    await SimulateurFactory.cleanup()
  })

  test('GET /simulateurs should list published simulateurs', async ({ client, assert }) => {
    // Create simulateurs with different statuses
    await SimulateurFactory.createMultipleSimulateurs()

    const response = await client.get('/simulateurs').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('simulateurs/index')

    const props = response.inertiaProps as { simulateurs: any[] }
    assert.property(props, 'simulateurs')
    assert.equal(props.simulateurs.length, 1)
    assert.equal(props.simulateurs[0].slug, 'published-sim')
  })

  test('GET /simulateurs/:slug should show a published simulateur', async ({ client }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'test-simulateur',
      title: 'Test Simulateur',
      status: 'published',
    })

    const response = await client
      .get(`/simulateurs/${simulateur.slug}`)
      .withInertia()

    response.assertInertiaPropsContains({
      simulateur: {
        slug: 'test-simulateur',
        title: 'Test Simulateur',
      },
    })
  })

  test('GET /simulateurs/:slug should show an unlisted simulateur', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'unlisted-sim',
      title: 'Unlisted Simulateur',
      status: 'unlisted',
    })

    const response = await client.get(`/simulateurs/${simulateur.slug}`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { simulateur: any }
    assert.property(props, 'simulateur')
    assert.equal(props.simulateur.slug, 'unlisted-sim')
  })

  test('GET /simulateurs/:slug should return 404 for draft simulateur', async ({ client }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'draft-sim',
      title: 'Draft Simulateur',
      status: 'draft',
    })

    const response = await client.get(`/simulateurs/${simulateur.slug}`)

    response.assertStatus(404)
  })

  test('GET /simulateurs/:slug should return 404 for non-existent simulateur', async ({ client }) => {
    const response = await client.get('/simulateurs/non-existent')

    response.assertStatus(404)
  })

  test('GET /simulateurs/:slug/recapitulatif should show recapitulatif page', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'recap-test',
      title: 'Recap Test',
      status: 'published',
    })

    const response = await client.get(`/simulateurs/${simulateur.slug}/recapitulatif`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { simulateur: any }
    assert.property(props, 'simulateur')
    assert.equal(props.simulateur.slug, 'recap-test')
  })

  test('GET /simulateurs/:slug/resultats/mock-hash should show mock results', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'results-test',
      title: 'Results Test',
      status: 'published',
    })

    const response = await client.get(`/simulateurs/${simulateur.slug}/resultats/mock-hash`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { simulateur: any, results: any, secureHash: string }
    assert.property(props, 'simulateur')
    assert.property(props, 'results')
    assert.property(props, 'secureHash')
    assert.equal(props.simulateur.slug, 'results-test')
    assert.equal(props.secureHash, 'mock-hash')
  })

  test('GET /simulateurs/:slug/resultats/:invalid-hash should return 404', async ({ client }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'invalid-hash-test',
      title: 'Invalid Hash Test',
      status: 'published',
    })

    const response = await client.get(`/simulateurs/${simulateur.slug}/resultats/invalid-hash`)

    response.assertStatus(404)
  })
})
