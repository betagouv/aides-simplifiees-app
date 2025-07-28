import FormSubmission from '#models/form_submission'
import { test } from '@japa/runner'

test.group('API FormSubmissionController', (group) => {
  // Clean up database before each test
  group.each.setup(async () => {
    await FormSubmission.query().delete()
  })

  // Additional cleanup after all tests
  group.teardown(async () => {
    await FormSubmission.query().delete()
  })

  test('POST /api/form-submissions should store form data and return secure hash', async ({ client, assert }) => {
    const formData = {
      simulateurSlug: 'demenagement-logement',
      answers: {
        question1: 'answer1',
        question2: 'answer2',
        situation: {
          income: 24000,
          household_size: 2,
        },
      },
      results: {
        eligible: true,
        amount: 1500,
        details: {
          criteria1: true,
          criteria2: false,
        },
      },
    }

    const response = await client
      .post('/api/form-submissions')
      .json(formData)

    // Assert response
    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Form data stored successfully',
    })

    // Ensure we got back the expected fields
    const body = response.body()
    assert.exists(body.submissionId)
    assert.exists(body.secureHash)
    assert.exists(body.resultsUrl)

    // Verify that the URL contains the correct structure
    assert.include(body.resultsUrl, `/simulateurs/${formData.simulateurSlug}/resultats/`)

    // Verify that the data was actually stored in the database
    const submission = await FormSubmission.findOrFail(body.submissionId)
    assert.equal(submission.simulateurSlug, formData.simulateurSlug)
    assert.deepEqual(submission.answers, formData.answers)
    assert.deepEqual(submission.results, formData.results)
  })

  test('POST /api/form-submissions should handle missing required fields', async ({ client }) => {
    // Missing simulateurSlug
    let response = await client
      .post('/api/form-submissions')
      .json({
        answers: { question1: 'answer1' },
        results: { eligible: true },
      })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: 'Missing required field: simulateurSlug',
    })

    // Missing answers
    response = await client
      .post('/api/form-submissions')
      .json({
        simulateurSlug: 'demenagement-logement',
        results: { eligible: true },
      })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: 'Missing required field: answers',
    })
  })

  test('POST /api/form-submissions should handle optional results field', async ({ client, assert }) => {
    // Omitting results should use default empty object
    const formData = {
      simulateurSlug: 'demenagement-logement',
      answers: { question1: 'answer1' },
    }

    const response = await client
      .post('/api/form-submissions')
      .json(formData)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })

    // Verify the submission was created with empty results object
    const body = response.body()
    const submission = await FormSubmission.findOrFail(body.submissionId)
    assert.deepEqual(submission.results, {})
  })

  test('GET /api/form-submissions/:hash should retrieve submission by hash', async ({ client }) => {
    // First create a submission
    const formData = {
      simulateurSlug: 'demenagement-logement',
      answers: { question1: 'answer1' },
      results: { eligible: true },
    }

    let response = await client
      .post('/api/form-submissions')
      .json(formData)

    const { secureHash } = response.body()

    // Now retrieve it by hash
    response = await client
      .get(`/api/form-submissions/${secureHash}`)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      submission: {
        simulateurSlug: 'demenagement-logement',
        answers: { question1: 'answer1' },
        results: { eligible: true },
      },
    })
  })

  test('GET /api/form-submissions/:hash should return 404 for non-existent hash', async ({ client }) => {
    const response = await client
      .get('/api/form-submissions/non-existent-hash')

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
      error: 'Form submission not found',
    })
  })

  test('GET /api/form-submissions/:hash should validate hash param', async ({ client }) => {
    const response = await client
      .get('/api/form-submissions/')

    response.assertStatus(404) // Route not found
  })
})
