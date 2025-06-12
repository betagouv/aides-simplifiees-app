import User from '#models/user'
import { SimulateurFactory } from '#tests/fixtures/simulateur_factory'
import { UserFactory } from '#tests/fixtures/user_factory'
import { test } from '@japa/runner'

test.group('AdminSimulateurController', (group) => {
  let adminUser: User

  group.setup(async () => {
    // Create an admin user for authentication
    adminUser = await UserFactory.createAdminUser()
  })

  group.each.setup(async () => {
    await SimulateurFactory.cleanup()
  })

  group.each.teardown(async () => {
    await SimulateurFactory.cleanup()
  })

  group.teardown(async () => {
    await UserFactory.cleanup()
  })

  test('GET /admin/simulateurs should list all simulateurs for admin', async ({ client, assert }) => {
    await SimulateurFactory.createMultipleSimulateurs()

    const response = await client
      .get('/admin/simulateurs')
      .loginAs(adminUser)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/simulateurs/index')

    // Check that simulateurs prop exists and has the correct length
    const props = response.inertiaProps as { simulateurs: any[] }
    assert.property(props, 'simulateurs')
    assert.equal(props.simulateurs.length, 3) // All statuses should be visible
  })

  test('GET /admin/simulateurs should redirect to login for non-admin user', async ({ client }) => {
    const regularUser = await User.create({
      email: 'user@test.com',
      password: 'password123',
      isAdmin: false,
    })

    const response = await client
      .get('/admin/simulateurs')
      .loginAs(regularUser)
      .withInertia()

    response.assertInertiaComponent('auth/login')
  })

  test('GET /admin/simulateurs/create should show create form', async ({ client }) => {
    const response = await client
      .get('/admin/simulateurs/create')
      .loginAs(adminUser)

    response.assertStatus(200)
  })

  test('POST /admin/simulateurs should create new simulateur', async ({ client, assert }) => {
    const simulateurData = {
      title: 'New Test Simulateur',
      slug: 'new-test-simulateur',
      status: 'draft',
      description: 'A new test simulateur',
      pictogramPath: '/icons/test.svg',
    }

    await client
      .post('/admin/simulateurs')
      .loginAs(adminUser)
      .withCsrfToken()
      .form(simulateurData)

    const createdSimulateur = await SimulateurFactory.findBySlug('new-test-simulateur')
    assert.isOk(createdSimulateur)
    assert.isNotNull(createdSimulateur)
    assert.equal(createdSimulateur!.title, 'New Test Simulateur')
  })

  test('POST /admin/simulateurs should auto-generate slug if not provided', async ({ client, assert }) => {
    const simulateurData = {
      title: 'Auto Slug Test',
      status: 'draft',
      description: 'Test auto slug generation',
      pictogramPath: '/icons/test.svg',
    }

    await client
      .post('/admin/simulateurs')
      .loginAs(adminUser)
      .withCsrfToken()
      .form(simulateurData)

    // Verify the simulateur was created with auto-generated slug
    const createdSimulateur = await SimulateurFactory.findBySlug('auto-slug-test')
    assert.isOk(createdSimulateur)
    assert.isNotNull(createdSimulateur)
    assert.equal(createdSimulateur!.title, 'Auto Slug Test')
  })

  test('GET /admin/simulateurs/:id/edit should show edit form', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur()

    const response = await client
      .get(`/admin/simulateurs/${simulateur.id}/edit`)
      .loginAs(adminUser)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('admin/simulateurs/edit')

    const props = response.inertiaProps as { simulateur: any }
    assert.property(props, 'simulateur')
    assert.equal(props.simulateur.id, simulateur.id)
  })

  test('GET /admin/simulateurs/:id/edit should return 404 for non-existent simulateur', async ({ client }) => {
    const response = await client
      .get('/admin/simulateurs/99999/edit')
      .loginAs(adminUser)

    response.assertStatus(404)
  })

  test('PUT /admin/simulateurs/:id should update simulateur', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      title: 'Original Title',
      status: 'draft',
    })

    const updateData = {
      title: 'Updated Title',
      status: 'published',
      description: 'Updated description',
    }

    await client
      .put(`/admin/simulateurs/${simulateur.id}`)
      .loginAs(adminUser)
      .withCsrfToken()
      .form(updateData)

    // Verify the simulateur was updated
    await simulateur.refresh()
    assert.equal(simulateur.title, 'Updated Title')
    assert.equal(simulateur.status, 'published')
    assert.equal(simulateur.description, 'Updated description')
  })

  test('PUT /admin/simulateurs/:id should return 404 for non-existent simulateur', async ({ client }) => {
    const response = await client
      .put('/admin/simulateurs/99999')
      .loginAs(adminUser)
      .withCsrfToken()
      .form({ title: 'Test' })

    response.assertStatus(404)
  })

  test('DELETE /admin/simulateurs/:id should delete simulateur', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur()
    const id = simulateur.id

    // const response =
    await client
      .delete(`/admin/simulateurs/${id}`)
      .loginAs(adminUser)
      .withCsrfToken()
      // .withInertia()

    // response.assertStatus(200)
    // response.assertInertiaComponent('admin/simulateurs/index')

    // Verify the simulateur was deleted
    const deletedSimulateur = await SimulateurFactory.findById(id)
    assert.isNull(deletedSimulateur)
  })

  test('DELETE /admin/simulateurs/:id should return 404 for non-existent simulateur', async ({ client }) => {
    const response = await client
      .delete('/admin/simulateurs/99999')
      .loginAs(adminUser)
      .withCsrfToken()

    response.assertStatus(404)
  })
})
