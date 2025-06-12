import type { ModelObject } from '@adonisjs/lucid/types/model'
import Simulateur from '#models/simulateur'

export class SimulateurFactory {
  /**
   * Create a basic simulateur for testing
   */
  static async createSimulateur(overrides: Partial<ModelObject> = {}): Promise<Simulateur> {
    const defaults = {
      slug: 'test-simulateur',
      title: 'Test Simulateur',
      description: 'A test simulateur for unit testing',
      pictogramPath: '/icons/test.svg',
      status: 'draft' as const,
    }

    return await Simulateur.create({ ...defaults, ...overrides })
  }

  /**
   * Create multiple simulateurs for testing listing/filtering
   */
  static async createMultipleSimulateurs(): Promise<Simulateur[]> {
    return await Promise.all([
      this.createSimulateur({
        slug: 'published-sim',
        title: 'Published Simulateur',
        status: 'published',
      }),
      this.createSimulateur({
        slug: 'draft-sim',
        title: 'Draft Simulateur',
        status: 'draft',
      }),
      this.createSimulateur({
        slug: 'unlisted-sim',
        title: 'Unlisted Simulateur',
        status: 'unlisted',
      }),
    ])
  }

  /**
   * Find a simulateur by slug for testing
   */
  static async findBySlug(slug: string): Promise<Simulateur | null> {
    return Simulateur.findBy('slug', slug)
  }

  /**
   * Find a simulateur by ID for testing
   */
  static async findById(id: number): Promise<Simulateur | null> {
    return Simulateur.find(id)
  }

  /**
   * Clean up test data
   */
  static async cleanup(): Promise<void> {
    await Simulateur.query().delete()
  }
}
