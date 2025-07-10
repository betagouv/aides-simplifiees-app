import User from '#models/user'
import { SimulateurFactory } from '#tests/fixtures/simulateur_factory'
import { UserFactory } from '#tests/fixtures/user_factory'
import { test } from '@japa/runner'

test.group('AdminPersonaController', (group) => {
  let adminUser: User
  let simulateur: Awaited<ReturnType<typeof SimulateurFactory.createSimulateur>>

  group.setup(async () => {
    // Create an admin user for authentication
    adminUser = await UserFactory.createAdminUser()
  })

  group.each.setup(async () => {
    await SimulateurFactory.cleanup()
    // Create a test simulateur for each test
    simulateur = await SimulateurFactory.createSimulateur({
      title: 'Test Simulateur for Personas',
      slug: 'test-persona-simulateur',
      status: 'published',
    })
  })

  group.each.teardown(async () => {
    await SimulateurFactory.cleanup()
  })

  group.teardown(async () => {
    await UserFactory.cleanup()
  })

  test('GET /admin/simulateurs/:simulateur_id/personas should list personas for simulateur', async ({ client, assert }) => {
    const response = await client
      .get(`/admin/simulateurs/${simulateur.id}/personas`)
      .loginAs(adminUser)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/personas/index')

    const props = response.inertiaProps as { personas: any[], simulateur: any }
    assert.property(props, 'personas')
    assert.property(props, 'simulateur')
    assert.equal(props.simulateur.id, simulateur.id)
    assert.isArray(props.personas)
  })

  test('GET /admin/simulateurs/:simulateur_id/personas/create should show create form', async ({ client, assert }) => {
    const response = await client
      .get(`/admin/simulateurs/${simulateur.id}/personas/create`)
      .loginAs(adminUser)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/personas/create')

    const props = response.inertiaProps as { simulateur: any }
    assert.property(props, 'simulateur')
    assert.equal(props.simulateur.id, simulateur.id)
  })

  test('POST /admin/simulateurs/:simulateur_id/personas should create new persona', async ({ client, assert }) => {
    const personaData = {
      name: 'Test Persona',
      description: 'A test persona for validation',
      testData: JSON.stringify({ age: 25, income: 2000 }),
      status: 'active',
    }

    const response = await client
      .post(`/admin/simulateurs/${simulateur.id}/personas`)
      .loginAs(adminUser)
      .withCsrfToken()
      .form(personaData)

    response.assertRedirectsTo(`/admin/simulateurs/${simulateur.id}/personas`)

    // Verify the persona was created
    await simulateur.load('personas')
    assert.equal(simulateur.personas.length, 1)
    assert.equal(simulateur.personas[0].name, 'Test Persona')
  })

  test('GET /admin/simulateurs/:simulateur_id/personas/:id/edit should show edit form', async ({ client, assert }) => {
    // Create a persona first
    const persona = await simulateur.related('personas').create({
      name: 'Edit Test Persona',
      description: 'A persona to test editing',
      testData: { age: 30 },
      status: 'active',
    })

    const response = await client
      .get(`/admin/simulateurs/${simulateur.id}/personas/${persona.id}/edit`)
      .loginAs(adminUser)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/personas/edit')

    const props = response.inertiaProps as { persona: any, simulateur: any }
    assert.property(props, 'persona')
    assert.property(props, 'simulateur')
    assert.equal(props.persona.id, persona.id)
    assert.equal(props.simulateur.id, simulateur.id)
  })

  test('PUT /admin/simulateurs/:simulateur_id/personas/:id should update persona', async ({ client, assert }) => {
    // Create a persona first
    const persona = await simulateur.related('personas').create({
      name: 'Original Name',
      description: 'Original description',
      testData: { age: 25 },
      status: 'active',
    })

    const updateData = {
      name: 'Updated Name',
      description: 'Updated description',
      testData: JSON.stringify({ age: 35, income: 3000 }),
      status: 'inactive',
    }

    const response = await client
      .put(`/admin/simulateurs/${simulateur.id}/personas/${persona.id}`)
      .loginAs(adminUser)
      .withCsrfToken()
      .form(updateData)

    response.assertRedirectsTo(`/admin/simulateurs/${simulateur.id}/personas`)

    // Verify the persona was updated
    await persona.refresh()
    assert.equal(persona.name, 'Updated Name')
    assert.equal(persona.description, 'Updated description')
    assert.equal(persona.status, 'inactive')
    // testData is now stored as an object, so we can compare directly
    assert.deepEqual(persona.testData, { age: 35, income: 3000 })
  })

  test('DELETE /admin/simulateurs/:simulateur_id/personas/:id should delete persona', async ({ client, assert }) => {
    // Create a persona first
    const persona = await simulateur.related('personas').create({
      name: 'Delete Test Persona',
      description: 'A persona to test deletion',
      testData: { age: 25 },
      status: 'active',
    })

    const response = await client
      .delete(`/admin/simulateurs/${simulateur.id}/personas/${persona.id}`)
      .loginAs(adminUser)
      .withCsrfToken()

    response.assertRedirectsTo(`/admin/simulateurs/${simulateur.id}/personas`)

    // Verify the persona was deleted
    await simulateur.load('personas')
    assert.equal(simulateur.personas.length, 0)
  })

  test('GET /admin/simulateurs/:simulateur_id/personas/export should export personas as JSON', async ({ client, assert }) => {
    // Create multiple personas
    await simulateur.related('personas').createMany([
      {
        name: 'Export Persona 1',
        description: 'First persona for export',
        testData: { age: 25, income: 1500 },
        status: 'active',
      },
      {
        name: 'Export Persona 2',
        description: 'Second persona for export',
        testData: { age: 35, income: 2500 },
        status: 'inactive',
      },
    ])

    const response = await client
      .get(`/admin/simulateurs/${simulateur.id}/personas/export`)
      .loginAs(adminUser)

    response.assertStatus(200)
    // Check that content-type contains application/json (charset may vary)
    const contentType = response.headers()['content-type']
    assert.include(contentType, 'application/json')
    response.assertHeader('content-disposition', `attachment; filename="${simulateur.slug}-personas.json"`)

    const exportedData = response.body()
    assert.isArray(exportedData)
    assert.equal(exportedData.length, 2)

    // Check that the exported data contains the expected fields
    exportedData.forEach((persona: any) => {
      assert.property(persona, 'name')
      assert.property(persona, 'description')
      assert.property(persona, 'test_data')
      assert.property(persona, 'status')
      // Should not contain internal fields
      assert.notProperty(persona, 'id')
      assert.notProperty(persona, 'simulateur_id')
      assert.notProperty(persona, 'created_at')
      assert.notProperty(persona, 'updated_at')
    })
  })

  test('should require admin authentication for all persona routes', async ({ client }) => {
    const regularUser = await User.create({
      email: 'regular@test.com',
      password: 'password123',
      isAdmin: false,
    })

    // Test various routes that should require admin access
    const routes = [
      `/admin/simulateurs/${simulateur.id}/personas`,
      `/admin/simulateurs/${simulateur.id}/personas/create`,
      `/admin/simulateurs/${simulateur.id}/personas/export`,
    ]

    for (const route of routes) {
      const response = await client
        .get(route)
        .loginAs(regularUser)
        .withInertia()

      response.assertInertiaComponent('auth/login')
    }

    // Clean up
    await regularUser.delete()
  })
})
