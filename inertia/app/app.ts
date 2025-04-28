/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import type { DefineComponent } from 'vue'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import VueDsfr from '@gouvminint/vue-dsfr'
import { addCollection } from '@iconify/vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createSSRApp, h } from 'vue'
import VueMatomo from 'vue-matomo'
import RouterLink from '~/components/RouterLink.vue'
import collections from '~/icon-collections'
import { getLayout } from './shared'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import '@gouvfr/dsfr/dist/component/component.main.min.css'
import '@gouvfr/dsfr/dist/utility/utility.main.min.css'
import '@gouvfr/dsfr/dist/scheme/scheme.min.css'
import '@gouvminint/vue-dsfr/styles'
import '~/styles/main.scss'
import SharedProps from '~/types/inertia'
const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: title => `${title} - ${appName}`,

  resolve: async (name) => {
    const page = await resolvePageComponent(
      `../pages/${name}.vue`,
      import.meta.glob<DefineComponent>('../pages/**/*.vue'),
    )
    page.default.layout ??= getLayout(`/${name}`)
    return page
  },

  setup({ el, App, props, plugin }) {
    const app = createSSRApp({ render: () => h(App, props) })
    app.config.warnHandler = (msg, _vm, trace) => {
      if (import.meta.env.MODE === 'development' && msg.match('Hydration')) {
        console.warn(`Intercepted Vue hydration mismatch warning`)
        return
      }
      console.warn(`[Vue warn]: ${msg}${trace}`)
    }
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    // Initialize DSFR
    app.use(VueDsfr)
    app.use(pinia)
    app.use(plugin)

    // Get config values from the page props
    const initialPageProps = props.initialPage.props as SharedProps
    const matomoHost = initialPageProps.matomoUrl ?? null
    const matomoSiteId = initialPageProps.matomoSiteId
      ? Number.parseInt(initialPageProps.matomoSiteId, 10)
      : null

    // Only initialize Matomo if we have valid config
    if (matomoHost !== null && matomoSiteId !== null) {
      app.use(VueMatomo, {
        host: matomoHost,
        siteId: matomoSiteId,
      })
    }

    for (const collection of collections) {
      addCollection(collection)
    }

    // Replace RouterLink with a custom component that uses Inertia's Link
    app.component('RouterLink', RouterLink)
    app.mount(el)
  },
})
