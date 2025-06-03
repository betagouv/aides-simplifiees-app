import Notion from '#models/notion'
import { NotionFactory } from '#tests/fixtures/notion_factory'
import { test } from '@japa/runner'

test.group('Notion Model', (group) => {
  group.each.setup(async () => {
    await NotionFactory.cleanup()
  })

  group.each.teardown(async () => {
    await NotionFactory.cleanup()
  })

  test('should create a notion with required fields', async ({ assert }) => {
    const notion = await NotionFactory.createNotion({
      slug: 'test-create',
      title: 'Test Creation',
    })

    assert.isOk(notion)
    assert.equal(notion.slug, 'test-create')
    assert.equal(notion.title, 'Test Creation')
    assert.equal(notion.status, 'draft')
    assert.isOk(notion.createdAt)
    assert.isOk(notion.updatedAt)
  })

  test('should accept all valid status values', async ({ assert }) => {
    const statuses = ['draft', 'published', 'unlisted'] as const

    for (const status of statuses) {
      const notion = await Notion.create({
        slug: `status-test-${status}`,
        title: `Status Test ${status}`,
        status,
      })

      assert.equal(notion.status, status)
    }
  })

  test('should enforce unique slug constraint', async ({ assert }) => {
    await NotionFactory.createNotion({
      slug: 'unique-slug',
      title: 'First Notion',
    })

    try {
      await NotionFactory.createNotion({
        slug: 'unique-slug',
        title: 'Second Notion',
      })
      assert.fail('Should have thrown an error for duplicate slug')
    }
    catch (error) {
      assert.isOk(error)
    }
  })

  test('should handle null optional fields', async ({ assert }) => {
    const notion = await Notion.create({
      slug: 'null-test',
      title: 'Null Test',
      description: null,
      metaDescription: null,
      content: null,
    })

    assert.isNull(notion.description)
    assert.isNull(notion.metaDescription)
    assert.isNull(notion.content)
  })

  test('should filter notions by status', async ({ assert }) => {
    await NotionFactory.createMultipleNotions()

    const published = await Notion.query().where('status', 'published')
    const drafts = await Notion.query().where('status', 'draft')

    assert.equal(published.length, 1)
    assert.equal(drafts.length, 1)
    assert.equal(published[0].status, 'published')
    assert.equal(drafts[0].status, 'draft')
  })

  test('should find notion by slug', async ({ assert }) => {
    await NotionFactory.createNotion({
      slug: 'findable-slug',
      title: 'Findable Notion',
    })

    const found = await Notion.findBy('slug', 'findable-slug')
    assert.isOk(found)
    assert.equal(found!.slug, 'findable-slug')
  })
})
