import env from '#start/env'
import { test } from '@japa/runner'
import axios from 'axios'
import sinon from 'sinon'

test.group('API OpenFiscaController', (group) => {
  let axiosPostStub: sinon.SinonStub
  let envGetStub: sinon.SinonStub

  // Set up the stubs before all tests
  group.setup(() => {
    // Stub the axios.post method
    axiosPostStub = sinon.stub(axios, 'post')

    // Stub the env.get method for OPENFISCA_URL
    envGetStub = sinon.stub(env, 'get')
    envGetStub.withArgs('OPENFISCA_URL').returns('https://openfisca-api.example.com')
    envGetStub.callThrough() // Allow other env.get calls to work normally

    // Set up a default response for our stub
    const mockOpenFiscaResponse = {
      status: 200,
      data: {
        calculated_amount: 1500,
        eligibility: true,
        aspects: {
          income_test: true,
          residence_test: true,
          age_test: true,
        },
      },
    }

    axiosPostStub.resolves(mockOpenFiscaResponse)
  })

  // Clean up stubs after each test group
  group.teardown(() => {
    axiosPostStub.restore()
    envGetStub.restore()
    // consoleErrorStub.restore()
  })

  test('POST /api/calculate should return calculation results', async ({ client }) => {
    const requestPayload = {
      situation: {
        person: {
          age: 35,
          income: 24000,
          household_size: 2,
        },
        residence: {
          postal_code: '75001',
          type: 'apartment',
        },
      },
      calculations: ['housing_benefit'],
    }

    const response = await client
      .post('/api/calculate')
      .json(requestPayload)

    // Assert response
    response.assertStatus(200)
    response.assertBodyContains({
      calculated_amount: 1500,
      eligibility: true,
    })

    // Verify axios.post was called with expected parameters
    sinon.assert.calledWith(
      axiosPostStub,
      'https://openfisca-api.example.com',
      requestPayload,
      sinon.match.object,
    )
  })

  test('POST /api/calculate should handle missing OPENFISCA_URL', async ({ client }) => {
    // Modify stub to return undefined for OPENFISCA_URL
    envGetStub.withArgs('OPENFISCA_URL').returns(undefined)

    const requestPayload = {
      situation: { person: { age: 35 } },
      calculations: ['housing_benefit'],
    }

    const response = await client
      .post('/api/calculate')
      .json(requestPayload)

    // Should return 500 with error message
    response.assertStatus(500)
    response.assertBodyContains({
      error: 'Missing OpenFisca URL in environment',
    })
  })
  test('POST /api/calculate should handle API errors', async ({ client }) => {
    // Reset the env stub to return the URL again (undoing changes from previous test)
    envGetStub.withArgs('OPENFISCA_URL').returns('https://openfisca-api.example.com')

    // Create an Axios error with a response
    const axiosError = new Error('Request failed with status code 400') as any
    axiosError.response = {
      status: 400,
      data: { error: 'Invalid input parameters' },
    }

    axiosPostStub.rejects(axiosError)

    const requestPayload = {
      situation: { person: { age: 35 } },
      calculations: ['housing_benefit'],
    }

    const response = await client
      .post('/api/calculate')
      .json(requestPayload)

    // Should return the API error status and message
    response.assertStatus(400)
    response.assertBodyContains({
      error: 400,
      message: { error: 'Invalid input parameters' },
    })
  })

  test('POST /api/calculate should handle network errors', async ({ client }) => {
    // Reset the env stub to return the URL again (undoing changes from previous test)
    envGetStub.withArgs('OPENFISCA_URL').returns('https://openfisca-api.example.com')

    // Set up the stub to simulate a network error with no response
    axiosPostStub.rejects(new Error('Network Error'))

    const requestPayload = {
      situation: { person: { age: 35 } },
      calculations: ['housing_benefit'],
    }

    const response = await client
      .post('/api/calculate')
      .json(requestPayload)

    // Should return 500 with general error message
    response.assertStatus(500)
    response.assertBodyContains({
      error: 500,
      message: 'Internal Server Error',
    })
  })
})
