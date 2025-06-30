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
})
