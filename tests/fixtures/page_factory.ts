import Page from '#models/page'

export class PageFactory {
  static async createPage(overrides: Partial<{
    title: string
    slug: string
    status: 'published' | 'draft' | 'unlisted'
    description: string | null
    metaDescription: string | null
    content: string | null
  }> = {}) {
    const defaultData = {
      title: 'Test Page',
      slug: 'test-page',
      status: 'draft' as const,
      description: 'Test page description',
      metaDescription: 'Test meta description',
      content: '<p>Test content</p>',
    }

    return Page.create({ ...defaultData, ...overrides })
  }

  static async createMultiplePages() {
    return Promise.all([
      this.createPage({
        slug: 'draft-page',
        title: 'Draft Page',
        status: 'draft',
      }),
      this.createPage({
        slug: 'published-page',
        title: 'Published Page',
        status: 'published',
      }),
      this.createPage({
        slug: 'unlisted-page',
        title: 'Unlisted Page',
        status: 'unlisted',
      }),
    ])
  }

  static async findBySlug(slug: string) {
    return Page.findBy('slug', slug)
  }

  static async cleanup() {
    await Page.query().delete()
  }
}
