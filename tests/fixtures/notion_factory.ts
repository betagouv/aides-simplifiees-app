import Notion from '#models/notion'

export class NotionFactory {
  static async createNotion(overrides: Partial<{
    title: string
    slug: string
    status: 'published' | 'draft' | 'unlisted'
    description: string | null
    metaDescription: string | null
    content: string | null
  }> = {}) {
    const defaultData = {
      title: 'Test Notion',
      slug: 'test-notion',
      status: 'draft' as const,
      description: 'Test notion description',
      metaDescription: 'Test meta description',
      content: '<p>Test notion content</p>',
    }

    return Notion.create({ ...defaultData, ...overrides })
  }

  static async createMultipleNotions() {
    return Promise.all([
      this.createNotion({
        slug: 'draft-notion',
        title: 'Draft Notion',
        status: 'draft',
      }),
      this.createNotion({
        slug: 'published-notion',
        title: 'Published Notion',
        status: 'published',
      }),
      this.createNotion({
        slug: 'unlisted-notion',
        title: 'Unlisted Notion',
        status: 'unlisted',
      }),
    ])
  }

  static async findBySlug(slug: string) {
    return Notion.findBy('slug', slug)
  }

  static async cleanup() {
    await Notion.query().delete()
  }
}
