import Simulateur from '#models/simulateur'
import { UserFactory } from '#tests/fixtures/user_factory'
import { test } from '@japa/runner'
import axios from 'axios'
import sinon from 'sinon'

test.group('API StatisticsController', (group) => {
  let axiosPostStub: sinon.SinonStub
  let adminUser: Awaited<ReturnType<typeof UserFactory.createAdminUser>>
  // let consoleErrorStub: sinon.SinonStub
  // let consoleWarnStub: sinon.SinonStub
  // let consoleInfoStub: sinon.SinonStub

  // Set up the stubs before all tests
  group.setup(async () => {
    // Stub the axios.post method
    axiosPostStub = sinon.stub(axios, 'post')

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
  })

  group.each.setup(() => {
    // Reset stubs before each test
    axiosPostStub.reset()
    // Mock the bulk API response - it returns an array of results for each request
    // The bulk API makes 1 HTTP request with 24 sub-requests (3 actions × 8 weeks)
    const mockBulkResponse = {
      status: 200,
      data: [
        // Start action results for 8 weeks
        [
          {
            Events_EventAction: 'Start',
            Events_EventName: '[demenagement-logement][website]',
            nb_events: 10,
          },
          {
            Events_EventAction: 'Start',
            Events_EventName: '[aide-renovation][website]',
            nb_events: 8,
          },
        ],
        [
          {
            Events_EventAction: 'Start',
            Events_EventName: '[demenagement-logement][website]',
            nb_events: 12,
          },
        ],
        [], // Empty week
        [
          {
            Events_EventAction: 'Start',
            Events_EventName: '[aide-renovation][website]',
            nb_events: 5,
          },
        ],
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
        // Submit action results for 8 weeks
        [
          {
            Events_EventAction: 'Submit',
            Events_EventName: '[demenagement-logement][website]',
            nb_events: 5,
          },
        ],
        [
          {
            Events_EventAction: 'Submit',
            Events_EventName: '[aide-renovation][website]',
            nb_events: 3,
          },
        ],
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
        // Eligibility action results for 8 weeks
        [
          {
            Events_EventAction: 'Eligibility',
            Events_EventName: '[demenagement-logement][website]',
            nb_events: 8,
          },
        ],
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
        [], // Empty week
      ],
    }
    axiosPostStub.resolves(mockBulkResponse)
  })

  // Clean up stubs after each test group
  group.teardown(() => {
    axiosPostStub.restore()
    // consoleErrorStub.restore()
    // consoleWarnStub.restore()
    // consoleInfoStub.restore()
  })

  test('GET /api/statistics should return statistics data', async ({ client, assert }) => {
    const response = await client
      .get('/api/statistics')
      .loginAs(adminUser)

    // Assert response
    response.assertStatus(200)
    response.assertBodyContains({ data: {} })
    response.assertBodyContains({ simulatorTitles: {} })

    // Verify axios.post was called only once (bulk API)
    sinon.assert.calledOnce(axiosPostStub)

    // Verify the response contains simulator titles for published simulators
    const responseBody = response.body()
    assert.containsSubset(responseBody.simulatorTitles, {
      'demenagement-logement': 'Aide au déménagement logement',
      'aide-renovation': 'Aide à la rénovation énergétique',
    })

    // Verify unpublished simulator is not included
    assert.notProperty(responseBody.simulatorTitles, 'unpublished-simulator')
  })

  test('GET /api/statistics should handle API errors gracefully', async ({ client }) => {
    // Set up the stub to simulate an error
    const persistentError = new Error('API Error')
    axiosPostStub.rejects(persistentError)

    const response = await client
      .get('/api/statistics')
      .loginAs(adminUser)

    // The controller handles API failures gracefully and returns 200 with empty data
    response.assertStatus(200)
    response.assertBodyContains({ data: {} })

    // Verify that only one bulk API call was made
    sinon.assert.calledOnce(axiosPostStub)
  })

  // test('GET /api/statistics should handle missing Matomo configuration', async ({ client }) => {
  // This test would require mocking the matomo config, but since it's imported at module level,
  // it's harder to mock. You might want to refactor the controller to inject the config.
  // For now, let's skip this test or create a separate test file with proper config mocking.
  // })
})
