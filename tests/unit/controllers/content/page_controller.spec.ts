import { PageFactory } from '#tests/fixtures/page_factory'
import { test } from '@japa/runner'

test.group('PageController', (group) => {
  group.each.setup(async () => {
    await PageFactory.cleanup()
  })

  group.each.teardown(async () => {
    await PageFactory.cleanup()
  })

  test('GET /content/:page_slug should show a published page', async ({ client, assert }) => {
    const page = await PageFactory.createPage({
      slug: 'test-page',
      title: 'Test Page',
      status: 'published',
      content: '# Test Content\n\nThis is a test page.',
    })

    const response = await client.get(`/content/${page.slug}`).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/pages/page')

    const props = response.inertiaProps as { page: any, html: string }
    assert.property(props, 'page')
    assert.property(props, 'html')
    assert.equal(props.page.slug, 'test-page')
    assert.equal(props.page.title, 'Test Page')
    assert.include(props.html, '<h1>Test Content</h1>')
    assert.include(props.html, '<p>This is a test page.</p>')
  })

  test('GET /content/:page_slug should show an unlisted page', async ({ client, assert }) => {
    const page = await PageFactory.createPage({
      slug: 'unlisted-page',
      title: 'Unlisted Page',
      status: 'unlisted',
      content: '# Unlisted Content',
    })

    const response = await client.get(`/content/${page.slug}`).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('content/pages/page')

    const props = response.inertiaProps as { page: any, html: string }
    assert.property(props, 'page')
    assert.property(props, 'html')
    assert.equal(props.page.slug, 'unlisted-page')
    assert.equal(props.page.title, 'Unlisted Page')
    assert.include(props.html, '<h1>Unlisted Content</h1>')
  })

  test('GET /content/:page_slug should return 404 for draft page', async ({ client }) => {
    const page = await PageFactory.createPage({
      slug: 'draft-page',
      title: 'Draft Page',
      status: 'draft',
      content: '# Draft Content',
    })

    const response = await client.get(`/content/${page.slug}`)

    response.assertStatus(404)
    // response.assertBodyContains('Page non trouvée')
  })

  test('GET /content/:page_slug should return 404 for non-existent page', async ({ client }) => {
    const response = await client.get('/content/non-existent-page')

    response.assertStatus(404)
    // response.assertBodyContains('Page non trouvée')
  })

  test('GET /content/:page_slug should properly render markdown content', async ({ client, assert }) => {
    const page = await PageFactory.createPage({
      slug: 'markdown-test',
      title: 'Markdown Test',
      status: 'published',
      content: `# Main Title

## Subtitle

This is **bold** and *italic* text.

- List item 1
- List item 2

[Link example](https://example.com)

\`\`\`javascript
console.log('Hello World');
\`\`\``,
    })

    const response = await client.get(`/content/${page.slug}`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { page: any, html: string }
    assert.include(props.html, '<h1>Main Title</h1>')
    assert.include(props.html, '<h2>Subtitle</h2>')
    assert.include(props.html, '<strong>bold</strong>')
    assert.include(props.html, '<em>italic</em>')
    assert.include(props.html, '<ul>')
    assert.include(props.html, '<li>List item 1</li>')
    assert.include(props.html, '<a href="https://example.com">Link example</a>')
    assert.include(props.html, '<pre><code')
    assert.include(props.html, 'console.log(&#39;Hello World&#39;);')
  })

  test('GET /content/:page_slug should handle special characters in slug', async ({ client, assert }) => {
    const page = await PageFactory.createPage({
      slug: 'page-with-special-chars',
      title: 'Page with Special Characters',
      status: 'published',
      content: '# Special Characters Test\n\nContent with éàç and 123.',
    })

    const response = await client.get(`/content/${page.slug}`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { page: any, html: string }
    assert.equal(props.page.slug, 'page-with-special-chars')
    assert.include(props.html, 'Content with éàç and 123.')
  })

  test('Page DTO should serialize correctly with all required fields', async ({ client, assert }) => {
    const page = await PageFactory.createPage({
      slug: 'dto-test',
      title: 'DTO Test Page',
      status: 'published',
      description: 'Test description',
      metaDescription: 'Test meta description',
      content: '# DTO Test',
    })

    const response = await client.get(`/content/${page.slug}`).withInertia()

    response.assertStatus(200)

    const props = response.inertiaProps as { page: any }
    const pageData = props.page

    assert.property(pageData, 'id')
    assert.property(pageData, 'updatedAt')
    assert.property(pageData, 'title')
    assert.property(pageData, 'slug')
    assert.property(pageData, 'description')
    assert.property(pageData, 'metaDescription')

    assert.equal(pageData.title, 'DTO Test Page')
    assert.equal(pageData.slug, 'dto-test')
    assert.equal(pageData.description, 'Test description')
    assert.equal(pageData.metaDescription, 'Test meta description')
    assert.isNumber(pageData.id)
    assert.isNotNull(pageData.updatedAt)
  })
})
