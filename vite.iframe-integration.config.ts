import { dirname, resolve } from 'node:path'

import { defineConfig } from 'vite'

// Use the package version for the iframe integration script
const IFRAME_SCRIPT_VERSION = '1.0.0'
const dir = dirname(import.meta.url).replace('file://', '')

export default defineConfig({
  build: {
    lib: {
      entry: resolve(dir, 'inertia/scripts/iframe-integration.js'),
      name: 'IframeIntegration',
      fileName: () => `iframe-integration@${IFRAME_SCRIPT_VERSION}.js`,
      formats: ['umd'],
    },
    outDir: resolve(dir, 'assets'),
    emptyOutDir: false,
    rollupOptions: {
      external: ['@iframe-resizer/parent'],
      output: {
        inlineDynamicImports: true,
        globals: {
          '@iframe-resizer/parent': 'iFrameResize',
        },
      },
    },
    minify: true,
  },
})
