import { getDirname } from '@adonisjs/core/helpers'
import inertia from '@adonisjs/inertia/client'
import adonisjs from '@adonisjs/vite/client'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    inertia({ ssr: { enabled: true, entrypoint: 'inertia/app/ssr.ts' } }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => {
            const dsfrChartCustomElements = [
              'line-chart',
              'scatter-chart',
              'bar-chart',
              'bar-line-chart',
              'pie-chart',
              'map-chart',
              'radar-chart',
              'gauge-chart',
              'data-box',
              'table-chart',
            ]
            return dsfrChartCustomElements.includes(tag)
          },
        },
      },
    }),
    adonisjs({ entrypoints: ['inertia/app/app.ts'], reload: ['resources/views/**/*.edge'] }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '~/': `${getDirname(import.meta.url)}/inertia/`,
      '~publicodes/': `${getDirname(import.meta.url)}/publicodes/`,
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use \'~/styles/dsfr-spacings\' as dsfr;',
      },
    },
  },

  /**
   * Bundle optimization configuration
   * Split vendor chunks strategically for better caching
   */
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vue core framework - stable, rarely changes
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return 'vue-core'
          }

          // Vue ecosystem - changes occasionally
          if (id.includes('node_modules/@inertiajs/') || id.includes('node_modules/pinia/')) {
            return 'vue-ecosystem'
          }

          // DSFR design system - large, stable
          if (id.includes('node_modules/@gouvminint/vue-dsfr/')) {
            return 'dsfr'
          }

          // Publicodes calculation engine - large, rarely changes
          if (
            id.includes('node_modules/publicodes/') ||
            id.includes('node_modules/@publicodes/')
          ) {
            return 'publicodes'
          }

          // VueUse utilities
          if (id.includes('node_modules/@vueuse/')) {
            return 'vueuse'
          }

          // Other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor'
          }
        },
      },
    },

    // Increase chunk size warning limit (default is 500kb)
    // Our app is complex and some chunks will be larger
    chunkSizeWarningLimit: 600,
  },
})
