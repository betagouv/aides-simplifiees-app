import User from '#models/user'

export class UserFactory {
  /**
   * Create a basic user for testing
   */
  static async createUser(overrides: Partial<User> = {}): Promise<User> {
    const defaults = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      isAdmin: false,
    }

    return await User.create({ ...defaults, ...overrides })
  }

  /**
   * Create an admin user for testing
   */
  static async createAdminUser(overrides: Partial<User> = {}): Promise<User> {
    return await this.createUser({
      email: 'admin@example.com',
      fullName: 'Admin User',
      isAdmin: true,
      ...overrides,
    })
  }

  /**
   * Clean up test data
   */
  static async cleanup(): Promise<void> {
    await User.query().delete()
  }
}
