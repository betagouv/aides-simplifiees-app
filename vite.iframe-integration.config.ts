import { dirname, resolve } from 'node:path'
import fs from 'node:fs'

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
    emptyOutDir: false,
  },
  plugins: [
    {
      name: 'create-non-versioned-copy',
      closeBundle: async () => {
        // Create the public directory if it doesn't exist
        const publicDir = resolve(dir, 'public')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }

        // Create a copy of the versioned file with the non-versioned name
        const versionedPath = resolve(dir, `public/assets/iframe-integration@${IFRAME_SCRIPT_VERSION}.js`)
        const nonVersionedPath = resolve(dir, 'public/iframe-integration.js')

        if (fs.existsSync(versionedPath)) {
          fs.copyFileSync(versionedPath, nonVersionedPath)
          console.log(`Created non-versioned copy at: ${nonVersionedPath}`)
        } else {
          console.error(`Versioned file not found at: ${versionedPath}`)
        }
      }
    }
  ]
})
