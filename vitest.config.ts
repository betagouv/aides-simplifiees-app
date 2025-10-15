import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['inertia/**/*.{ts,vue}'],
      exclude: [
        'inertia/**/*.d.ts',
        'inertia/types/**',
        'inertia/app/**',
        'inertia/icon_collections.ts',
      ],
    },
    include: ['tests/frontend/**/*.{test,spec}.{js,ts}'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./inertia', import.meta.url)),
    },
  },
})
