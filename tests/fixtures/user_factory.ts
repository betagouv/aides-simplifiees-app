import User from '#models/user'

export class UserFactory {
  /**
   * Create a basic user for testing
   * Uses a unique email by default to prevent conflicts in parallel test execution
   */
  static async createUser(overrides: Partial<User> = {}): Promise<User> {
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const defaults = {
      email: uniqueEmail,
      password: 'password123',
      fullName: 'Test User',
      isAdmin: false,
    }

    return await User.create({ ...defaults, ...overrides })
  }

  /**
   * Create an admin user for testing
   * Uses a unique email by default to prevent conflicts in parallel test execution
   */
  static async createAdminUser(overrides: Partial<User> = {}): Promise<User> {
    const uniqueEmail = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    return await this.createUser({
      email: uniqueEmail,
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
