import type { DefineComponent } from 'vue'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { addCollection } from '@iconify/vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createSSRApp, h } from 'vue'
import RouterLink from '~/components/RouterLink.vue'
import collections from '~/icon_collections'
import { getLayout } from './shared'

// Type kept as any: Inertia's page prop type is complex and varies per route
export default function render(page: any) {
  return createInertiaApp({
    page,
    render: renderToString,

    resolve: async (name) => {
      const ssrPage = await resolvePageComponent(
        `../pages/${name}.vue`,
        import.meta.glob<DefineComponent>('../pages/**/*.vue'),
      )
      ssrPage.default.layout ??= getLayout(`/${name}`)
      return ssrPage
    },

    setup({ App, props, plugin }) {
      const ssrApp = createSSRApp({ render: () => h(App, props) })
      ssrApp.use(plugin)
      const pinia = createPinia()
      ssrApp.use(pinia)

      // Register icon collections
      for (const collection of collections) {
        addCollection(collection)
      }

      // Replace RouterLink with a custom component that uses Inertia's Link
      ssrApp.component('RouterLink', RouterLink)
      return ssrApp
    },
  })
}
