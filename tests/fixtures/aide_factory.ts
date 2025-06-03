import Aide from '#models/aide'
import TypeAide from '#models/type_aide'
import { TypeAideFactory } from './type_aide_factory.js'

export class AideFactory {
  static async createAide(overrides: Partial<{
    title: string
    slug: string
    status: 'published' | 'draft' | 'unlisted'
    description: string | null
    metaDescription: string | null
    content: string | null
    typeAideSlug?: string
    typeAideId?: number
    usage: UsageAide | null
    instructeur: string | null
    textesLoi: TexteLoi[]
  }> = {}) {
    // Handle typeAide relationship
    let typeAideId = overrides.typeAideId
    if (!typeAideId && overrides.typeAideSlug) {
      const typeAide = await TypeAide.findBy('slug', overrides.typeAideSlug)
      if (!typeAide) {
        const newTypeAide = await TypeAideFactory.createTypeAide({ slug: overrides.typeAideSlug })
        typeAideId = newTypeAide.id
      }
      else {
        typeAideId = typeAide.id
      }
    }
    if (!typeAideId) {
      // Create default type aide if none provided
      const defaultTypeAide = await TypeAide.findBy('slug', 'aide-financiere')
      if (!defaultTypeAide) {
        const newTypeAide = await TypeAideFactory.createTypeAide()
        typeAideId = newTypeAide.id
      }
      else {
        typeAideId = defaultTypeAide.id
      }
    }

    const defaultData = {
      title: 'Test Aide',
      slug: 'test-aide',
      status: 'draft' as const,
      description: 'Test aide description',
      metaDescription: 'Test meta description',
      content: '<p>Test aide content</p>',
      typeAideId,
      usage: 'loyer-logement' as UsageAide,
      instructeur: 'CAF',
      textesLoi: [
        { label: 'Test article', url: 'https://example.com/article' },
      ] as TexteLoi[],
    }

    // Remove typeAideSlug from overrides before merging
    const { typeAideSlug, ...cleanOverrides } = overrides
    return Aide.create({ ...defaultData, ...cleanOverrides })
  }

  static async createMultipleAides() {
    return Promise.all([
      this.createAide({
        slug: 'draft-aide',
        title: 'Draft Aide',
        status: 'draft',
        typeAideSlug: 'aide-financiere',
        usage: 'loyer-logement',
      }),
      this.createAide({
        slug: 'published-aide',
        title: 'Published Aide',
        status: 'published',
        typeAideSlug: 'pret',
        usage: 'caution-logement',
      }),
      this.createAide({
        slug: 'unlisted-aide',
        title: 'Unlisted Aide',
        status: 'unlisted',
        typeAideSlug: 'garantie',
        usage: 'pret-garantie-logement',
      }),
    ])
  }

  static async findBySlug(slug: string) {
    return Aide.findBy('slug', slug)
  }

  static async cleanup() {
    await Aide.query().delete()
    await TypeAideFactory.cleanup()
  }
}
