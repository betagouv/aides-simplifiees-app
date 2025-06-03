import { test } from '@japa/runner'

test.group('Basic Unit Test', () => {
  test('should run a basic test', ({ assert }) => {
    assert.equal(1 + 1, 2)
  })
})
