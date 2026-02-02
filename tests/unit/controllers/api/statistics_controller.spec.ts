import Simulateur from '#models/simulateur'
import { UserFactory } from '#tests/fixtures/user_factory'
import { test } from '@japa/runner'

test.group('API StatisticsController', (group) => {
  let adminUser: Awaited<ReturnType<typeof UserFactory.createAdminUser>>

  // Set up test data before all tests
  group.setup(async () => {
    adminUser = await UserFactory.createAdminUser()

    // Create test simulators with published status
    await Simulateur.create({
      slug: 'demenagement-logement',
      title: 'Aide au déménagement logement',
      status: 'published',
    })
    await Simulateur.create({
      slug: 'aide-renovation',
      title: 'Aide à la rénovation énergétique',
      status: 'published',
    })
    await Simulateur.create({
      slug: 'unpublished-simulator',
      title: 'Simulateur non publié',
      status: 'draft', // This should NOT appear in results
    })
    await Simulateur.create({
      slug: 'unlisted-simulator',
      title: 'Simulateur non répertorié',
      status: 'unlisted', // This should NOT appear in results either
    })
  })

  test('GET /api/statistics should return statistics data', async ({ client, assert }) => {
    const response = await client
      .get('/api/statistics')
      .loginAs(adminUser)

    // Assert response status
    response.assertStatus(200)

    // Get response body
    const responseBody = response.body()

    // Verify structure - new API returns data array and simulatorTitles
    assert.isArray(responseBody.data)
    assert.isObject(responseBody.simulatorTitles)
    assert.isObject(responseBody.meta)

    // Verify the response contains simulator titles for published simulators
    assert.containsSubset(responseBody.simulatorTitles, {
      'demenagement-logement': 'Aide au déménagement logement',
      'aide-renovation': 'Aide à la rénovation énergétique',
    })

    // Verify unpublished simulator is not included
    assert.notProperty(responseBody.simulatorTitles, 'unpublished-simulator')

    // Verify unlisted simulator is not included
    assert.notProperty(responseBody.simulatorTitles, 'unlisted-simulator')

    // Verify meta contains expected fields
    assert.property(responseBody.meta, 'sources')
    assert.property(responseBody.meta, 'availableSources')
    assert.property(responseBody.meta, 'granularity')
    assert.property(responseBody.meta, 'startDate')
    assert.property(responseBody.meta, 'endDate')
    assert.property(responseBody.meta, 'providers')
  })

  test('GET /api/statistics should support granularity parameter', async ({ client, assert }) => {
    const response = await client
      .get('/api/statistics')
      .qs({ granularity: 'month' })
      .loginAs(adminUser)

    response.assertStatus(200)
    const responseBody = response.body()
    assert.equal(responseBody.meta.granularity, 'month')
  })

  test('GET /api/statistics should reject invalid granularity', async ({ client }) => {
    const response = await client
      .get('/api/statistics')
      .qs({ granularity: 'invalid' })
      .loginAs(adminUser)

    response.assertStatus(400)
    response.assertBodyContains({ error: 'Invalid granularity' })
  })

  test('GET /api/statistics should handle date range parameters', async ({ client, assert }) => {
    const response = await client
      .get('/api/statistics')
      .qs({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      })
      .loginAs(adminUser)

    response.assertStatus(200)
    const responseBody = response.body()
    assert.equal(responseBody.meta.startDate, '2025-01-01')
    assert.equal(responseBody.meta.endDate, '2025-01-31')
  })
})
