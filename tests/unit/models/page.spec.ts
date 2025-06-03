import Page from '#models/page'
import { PageFactory } from '#tests/fixtures/page_factory'
import { test } from '@japa/runner'

test.group('Page Model', (group) => {
  group.each.setup(async () => {
    await PageFactory.cleanup()
  })

  group.each.teardown(async () => {
    await PageFactory.cleanup()
  })

  test('should create a page with required fields', async ({ assert }) => {
    const page = await PageFactory.createPage({
      slug: 'test-create',
      title: 'Test Creation',
    })

    assert.isOk(page)
    assert.equal(page.slug, 'test-create')
    assert.equal(page.title, 'Test Creation')
    assert.equal(page.status, 'draft')
    assert.isOk(page.createdAt)
    assert.isOk(page.updatedAt)
  })

  test('should accept all valid status values', async ({ assert }) => {
    const statuses = ['draft', 'published', 'unlisted'] as const

    for (const status of statuses) {
      const page = await Page.create({
        slug: `status-test-${status}`,
        title: `Status Test ${status}`,
        status,
      })

      assert.equal(page.status, status)
    }
  })

  test('should enforce unique slug constraint', async ({ assert }) => {
    await PageFactory.createPage({
      slug: 'unique-slug',
      title: 'First Page',
    })

    try {
      await PageFactory.createPage({
        slug: 'unique-slug',
        title: 'Second Page',
      })
      assert.fail('Should have thrown an error for duplicate slug')
    }
    catch (error) {
      assert.isOk(error)
    }
  })

  test('should handle null optional fields', async ({ assert }) => {
    const page = await Page.create({
      slug: 'null-test',
      title: 'Null Test',
      description: null,
      metaDescription: null,
      content: null,
    })

    assert.isNull(page.description)
    assert.isNull(page.metaDescription)
    assert.isNull(page.content)
  })

  test('should filter pages by status', async ({ assert }) => {
    await PageFactory.createMultiplePages()

    const published = await Page.query().where('status', 'published')
    const drafts = await Page.query().where('status', 'draft')

    assert.equal(published.length, 1)
    assert.equal(drafts.length, 1)
    assert.equal(published[0].status, 'published')
    assert.equal(drafts[0].status, 'draft')
  })

  test('should find page by slug', async ({ assert }) => {
    await PageFactory.createPage({
      slug: 'findable-slug',
      title: 'Findable Page',
    })

    const found = await Page.findBy('slug', 'findable-slug')
    assert.isOk(found)
    assert.equal(found!.slug, 'findable-slug')
  })
})
