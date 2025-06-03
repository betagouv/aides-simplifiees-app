import TypeAide from '#models/type_aide'

export class TypeAideFactory {
  static async createTypeAide(overrides: Partial<{
    slug: string
    label: string
    iconName: string
  }> = {}) {
    const defaultData = {
      slug: 'aide-financiere',
      label: 'Aide financière',
      iconName: 'ri:money-euro-circle-line',
    }

    return TypeAide.create({ ...defaultData, ...overrides })
  }

  static async createMultipleTypesAide() {
    return Promise.all([
      this.createTypeAide({
        slug: 'aide-financiere',
        label: 'Aide financière',
        iconName: 'ri:money-euro-circle-line',
      }),
      this.createTypeAide({
        slug: 'pret',
        label: 'Prêt',
        iconName: 'ri:arrow-left-right-line',
      }),
      this.createTypeAide({
        slug: 'garantie',
        label: 'Garantie',
        iconName: 'ri:chat-check-line',
      }),
    ])
  }

  static async findBySlug(slug: string) {
    return TypeAide.findBy('slug', slug)
  }

  static async cleanup() {
    await TypeAide.query().delete()
  }
}
