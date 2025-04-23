import { dirname, resolve } from 'node:path'

import { defineConfig } from 'vite'

// Use the package version for the iframe integration script
const IFRAME_SCRIPT_VERSION = '1.0.1'
const dir = dirname(import.meta.url).replace('file://', '')

export default defineConfig({
  build: {
    copyPublicDir: false,
    outDir: resolve(dir, 'public/assets'),
    rollupOptions: {
      input: {
        iframeIntegration: resolve(dir, 'inertia/scripts/iframe-integration.js'),
      },
      output: {
        entryFileNames: `iframe-integration@${IFRAME_SCRIPT_VERSION}.js`,
        chunkFileNames: `iframe-integration@${IFRAME_SCRIPT_VERSION}.js`,
        assetFileNames: `iframe-integration@${IFRAME_SCRIPT_VERSION}.js`,
      },
    },
    minify: true,
  },
})
