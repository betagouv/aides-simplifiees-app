import { NotionFactory } from '#tests/fixtures/notion_factory'
import { SimulateurFactory } from '#tests/fixtures/simulateur_factory'
import { test } from '@japa/runner'

test.group('NotionController', (group) => {
  group.each.setup(async () => {
    await NotionFactory.cleanup()
    await SimulateurFactory.cleanup()
  })

  group.each.teardown(async () => {
    await NotionFactory.cleanup()
    await SimulateurFactory.cleanup()
  })

  test('GET /notions should list published notions', async ({ client, assert }) => {
    // Create notions with different statuses
    await NotionFactory.createNotion({
      slug: 'published-notion',
      title: 'Published Notion',
      status: 'published',
    })
    await NotionFactory.createNotion({
      slug: 'draft-notion',
      title: 'Draft Notion',
      status: 'draft',
    })
    await NotionFactory.createNotion({
      slug: 'unlisted-notion',
      title: 'Unlisted Notion',
      status: 'unlisted',
    })

    const response = await client.get('/notions').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/notions/notions')

    const props = response.inertiaProps as { notions: any[] }
    assert.property(props, 'notions')
    assert.equal(props.notions.length, 1)
    assert.equal(props.notions[0].slug, 'published-notion')
    assert.equal(props.notions[0].title, 'Published Notion')
  })

  test('GET /notions/:notion_slug should show a published notion', async ({ client, assert }) => {
    const notion = await NotionFactory.createNotion({
      slug: 'test-notion',
      title: 'Test Notion',
      status: 'published',
      content: '# Test Notion Content\n\nThis is a test notion.',
    })

    const response = await client.get(`/notions/${notion.slug}`).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/notions/notion')

    const props = response.inertiaProps as { notion: any, html: string }
    assert.property(props, 'notion')
    assert.property(props, 'html')
    assert.equal(props.notion.slug, 'test-notion')
    assert.equal(props.notion.title, 'Test Notion')
    assert.include(props.html, '<h1>Test Notion Content</h1>')
    assert.include(props.html, '<p>This is a test notion.</p>')
  })

  test('GET /notions/:notion_slug should show an unlisted notion', async ({ client, assert }) => {
    const notion = await NotionFactory.createNotion({
      slug: 'unlisted-notion',
      title: 'Unlisted Notion',
      status: 'unlisted',
      content: '# Unlisted Notion Content',
    })

    const response = await client.get(`/notions/${notion.slug}`).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/notions/notion')

    const props = response.inertiaProps as { notion: any, html: string }
    assert.property(props, 'notion')
    assert.property(props, 'html')
    assert.equal(props.notion.slug, 'unlisted-notion')
    assert.equal(props.notion.title, 'Unlisted Notion')
    assert.include(props.html, '<h1>Unlisted Notion Content</h1>')
  })

  test('GET /notions/:notion_slug should return 404 for draft notion', async ({ client }) => {
    const notion = await NotionFactory.createNotion({
      slug: 'draft-notion',
      title: 'Draft Notion',
      status: 'draft',
      content: '# Draft Content',
    })

    const response = await client.get(`/notions/${notion.slug}`)

    response.assertStatus(404)
    // response.assertBodyContains('Notion non trouvée')
  })

  test('GET /notions/:notion_slug should return 404 for non-existent notion', async ({ client }) => {
    const response = await client.get('/notions/non-existent-notion')

    response.assertStatus(404)
    // response.assertBodyContains('Notion non trouvée')
  })

  test('GET /simulateurs/:simulateur_slug/notions/:notion_slug should show notion with simulateur context', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'test-simulateur',
      title: 'Test Simulateur',
      status: 'published',
    })

    const notion = await NotionFactory.createNotion({
      slug: 'contextualized-notion',
      title: 'Contextualized Notion',
      status: 'published',
      content: '# Notion with Context\n\nThis notion is shown with simulateur context.',
    })

    const response = await client
      .get(`/simulateurs/${simulateur.slug}/notions/${notion.slug}`)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/notions/simulateur-notion')

    const props = response.inertiaProps as { notion: any, simulateur: any, html: string }
    assert.property(props, 'notion')
    assert.property(props, 'simulateur')
    assert.property(props, 'html')

    assert.equal(props.notion.slug, 'contextualized-notion')
    assert.equal(props.notion.title, 'Contextualized Notion')
    assert.equal(props.simulateur.slug, 'test-simulateur')
    assert.equal(props.simulateur.title, 'Test Simulateur')
    assert.include(props.html, '<h1>Notion with Context</h1>')
  })

  test('GET /simulateurs/:simulateur_slug/notions/:notion_slug should return 404 when notion not found', async ({ client }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'test-simulateur',
      title: 'Test Simulateur',
      status: 'published',
    })

    const response = await client.get(`/simulateurs/${simulateur.slug}/notions/non-existent-notion`)

    response.assertStatus(404)
    // response.assertBodyContains('Notion non trouvée')
  })

  test('GET /simulateurs/:simulateur_slug/notions/:notion_slug should return 404 when simulateur not found', async ({ client }) => {
    const notion = await NotionFactory.createNotion({
      slug: 'test-notion',
      title: 'Test Notion',
      status: 'published',
    })

    const response = await client.get(`/simulateurs/non-existent-simulateur/notions/${notion.slug}`)

    response.assertStatus(404)
    // response.assertBodyContains('Simulateur non trouvé')
  })

  test('GET /simulateurs/:simulateur_slug/notions/:notion_slug should handle unlisted simulateur and notion', async ({ client, assert }) => {
    const simulateur = await SimulateurFactory.createSimulateur({
      slug: 'unlisted-simulateur',
      title: 'Unlisted Simulateur',
      status: 'unlisted',
    })

    const notion = await NotionFactory.createNotion({
      slug: 'unlisted-notion',
      title: 'Unlisted Notion',
      status: 'unlisted',
      content: '# Unlisted Context Test',
    })

    const response = await client
      .get(`/simulateurs/${simulateur.slug}/notions/${notion.slug}`)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/notions/simulateur-notion')

    const props = response.inertiaProps as { notion: any, simulateur: any, html: string }
    assert.equal(props.notion.slug, 'unlisted-notion')
    assert.equal(props.simulateur.slug, 'unlisted-simulateur')
    assert.include(props.html, '<h1>Unlisted Context Test</h1>')
  })

  test('Notion DTOs should serialize correctly', async ({ client, assert }) => {
    const notion = await NotionFactory.createNotion({
      slug: 'dto-test',
      title: 'DTO Test Notion',
      status: 'published',
      description: 'Test description',
      metaDescription: 'Test meta description',
      content: '# DTO Test',
    })

    const response = await client.get(`/notions/${notion.slug}`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { notion: any }
    const notionData = props.notion

    // SingleDto properties
    assert.property(notionData, 'id')
    assert.property(notionData, 'updatedAt')
    assert.property(notionData, 'title')
    assert.property(notionData, 'slug')
    assert.property(notionData, 'description')
    assert.property(notionData, 'metaDescription')

    assert.equal(notionData.title, 'DTO Test Notion')
    assert.equal(notionData.slug, 'dto-test')
    assert.equal(notionData.description, 'Test description')
    assert.equal(notionData.metaDescription, 'Test meta description')
    assert.isNumber(notionData.id)
    assert.isNotNull(notionData.updatedAt)
  })

  test('NotionController ListDto should serialize correctly for index page', async ({ client, assert }) => {
    await NotionFactory.createNotion({
      slug: 'list-test-1',
      title: 'List Test Notion 1',
      status: 'published',
      description: 'First test description',
    })
    await NotionFactory.createNotion({
      slug: 'list-test-2',
      title: 'List Test Notion 2',
      status: 'published',
      description: 'Second test description',
    })

    const response = await client.get('/notions').withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { notions: any[] }
    assert.equal(props.notions.length, 2)

    // Check ListDto properties for each notion
    props.notions.forEach((notion, index) => {
      assert.property(notion, 'title')
      assert.property(notion, 'slug')
      assert.property(notion, 'description')

      // Check that SingleDto properties are NOT included in ListDto
      assert.notProperty(notion, 'id')
      assert.notProperty(notion, 'updatedAt')
      assert.notProperty(notion, 'metaDescription')

      if (index === 0) {
        assert.equal(notion.title, 'List Test Notion 1')
        assert.equal(notion.slug, 'list-test-1')
        assert.equal(notion.description, 'First test description')
      }
    })
  })
})
