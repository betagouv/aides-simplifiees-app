import env from '#start/env'
import { test } from '@japa/runner'
import axios from 'axios'
import sinon from 'sinon'

test.group('API GeoApiController', (group) => {
  let axiosGetStub: sinon.SinonStub
  let envGetStub: sinon.SinonStub

  // Set up the stubs before all tests
  group.setup(() => {
    // Stub the axios.get method
    axiosGetStub = sinon.stub(axios, 'get')

    // Stub console methods to prevent pollution
    sinon.stub(console, 'error')

    // Stub the env.get method for LEXIMPACT_URL
    envGetStub = sinon.stub(env, 'get')
    envGetStub.withArgs('LEXIMPACT_URL').returns('https://api-adresse.data.gouv.fr')
    envGetStub.callThrough() // Allow other env.get calls to work normally

    // Set up a default response for our stub
    const mockCommunesResponse = {
      status: 200,
      data: {
        suggestions: [
          {
            commune: 'Paris',
            distributions_postales: '75001, 75002, 75003, 75004',
            code_postal: '75000',
            code_insee: '75056',
          },
          {
            commune: 'Marseille',
            distributions_postales: '13001, 13002, 13003',
            code_postal: '13000',
            code_insee: '13055',
          },
        ],
      },
    }

    axiosGetStub.resolves(mockCommunesResponse)
  })

  // Clean up stubs after each test group
  group.teardown(() => {
    axiosGetStub.restore()
    envGetStub.restore()
  })

  test('GET /api/autocomplete/communes should return commune suggestions', async ({ client }) => {
    const response = await client
      .get('/api/autocomplete/communes')
      .qs({ q: 'paris' })

    // Assert response
    response.assertStatus(200)
    response.assertBodyContains({
      suggestions: [
        { commune: 'Paris' },
      ],
    })

    // Verify axios.get was called with expected parameters
    sinon.assert.calledWith(
      axiosGetStub,
      'https://api-adresse.data.gouv.fr/communes/autocomplete?q=paris&field=commune&field=distributions_postales',
      sinon.match.object,
    )
  })

  test('GET /api/autocomplete/communes should handle missing query param', async ({ client }) => {
    // Reset the stub before this test
    axiosGetStub.reset()

    const response = await client
      .get('/api/autocomplete/communes')
      // Explicitly send an empty query string
      .qs({ q: '' })

    // Should still return 200 but with empty suggestions
    response.assertStatus(200)
    response.assertBodyContains({ suggestions: [] })

    // No API call should be made
    sinon.assert.notCalled(axiosGetStub)
  })

  test('GET /api/autocomplete/communes should handle API errors gracefully', async ({ client }) => {
    // Set up the stub to simulate an error
    axiosGetStub.rejects(new Error('API Error'))

    const response = await client
      .get('/api/autocomplete/communes')
      .qs({ q: 'paris' })

    // Should return 200 with empty suggestions and error message
    response.assertStatus(200)
    response.assertBodyContains({
      suggestions: [],
      error: 'Failed to fetch commune data',
    })
  })

  test('GET /api/autocomplete/communes should handle missing LEXIMPACT_URL', async ({ client }) => {
    // Modify stub to return undefined for LEXIMPACT_URL
    envGetStub.withArgs('LEXIMPACT_URL').returns(undefined)

    const response = await client
      .get('/api/autocomplete/communes')
      .qs({ q: 'paris' })

    // Should return 500 with error message
    response.assertStatus(500)
    response.assertBodyContains({
      error: 'Missing LexImpact URL in environment',
    })
  })
})
