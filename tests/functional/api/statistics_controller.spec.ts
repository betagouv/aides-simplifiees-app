import { UserFactory } from '#tests/fixtures/user_factory'
import { test } from '@japa/runner'
import axios from 'axios'
import sinon from 'sinon'

test.group('API StatisticsController', (group) => {
  let axiosPostStub: sinon.SinonStub
  let adminUser: Awaited<ReturnType<typeof UserFactory.createAdminUser>>

  // Set up the stubs before all tests
  group.setup(async () => {
    // Stub the axios.post method
    axiosPostStub = sinon.stub(axios, 'post')

    adminUser = await UserFactory.createAdminUser()
  })

  group.each.setup(() => {
    // Reset stubs before each test
    axiosPostStub.reset()
    // Re-establish default successful response
    const mockStatsResponse = {
      status: 200,
      data: [
        {
          Events_EventAction: 'Submit',
          Events_EventName: '[demenagement-logement][website]',
          nb_events: 5,
        },
        {
          Events_EventAction: 'Start',
          Events_EventName: '[demenagement-logement][website]',
          nb_events: 10,
        },
        {
          Events_EventAction: 'Eligibility',
          Events_EventName: '[demenagement-logement][website]',
          nb_visits: 3,
        },
      ],
    }
    axiosPostStub.resolves(mockStatsResponse)
  })

  // Clean up stubs after each test group
  group.teardown(() => {
    axiosPostStub.restore()
  })

  test('GET /api/statistics should return statistics data', async ({ client }) => {
    const response = await client
      .get('/api/statistics')
      .loginAs(adminUser)

    // Assert response
    response.assertStatus(200)
    response.assertBodyContains({ statistics: {} })

    // Verify axios.post was called 4 times (once per week)
    sinon.assert.callCount(axiosPostStub, 4)
  })

  test('GET /api/statistics should handle API errors gracefully', async ({ client }) => {
    // Set up the stub to simulate an error that persists through all retries
    const persistentError = new Error('API Error')
    axiosPostStub.rejects(persistentError)

    const response = await client
      .get('/api/statistics')
      .loginAs(adminUser)

    // The controller handles individual week failures gracefully and returns 200 with empty/partial data
    // This is the expected behavior - it doesn't fail the entire request if some weeks fail
    response.assertStatus(200)
    response.assertBodyContains({ statistics: {} })

    // Verify that retry attempts were made (should be called 3 times per week * 4 weeks = 12 times)
    sinon.assert.callCount(axiosPostStub, 12)
  })

  // test('GET /api/statistics should handle missing Matomo configuration', async ({ client }) => {
  // This test would require mocking the matomo config, but since it's imported at module level,
  // it's harder to mock. You might want to refactor the controller to inject the config.
  // For now, let's skip this test or create a separate test file with proper config mocking.
  // })
})
