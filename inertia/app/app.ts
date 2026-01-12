/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />
/// <reference path="../../config/auth.ts" />

import type { SharedProps } from '@adonisjs/inertia/types'
import type { DefineComponent } from 'vue'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import VueDsfr from '@gouvminint/vue-dsfr'
import { addCollection, setCustomIconLoader } from '@iconify/vue'
import { createInertiaApp, usePage } from '@inertiajs/vue3'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createSSRApp, h } from 'vue'
import VueMatomo from 'vue-matomo'
import RouterLink from '~/components/RouterLink.vue'
import collections from '~/icon_collections'
import { getLayout } from './shared'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import '@gouvfr/dsfr/dist/component/component.main.min.css'
import '@gouvfr/dsfr/dist/utility/utility.main.min.css'
import '@gouvfr/dsfr/dist/scheme/scheme.min.css'
import '@gouvminint/vue-dsfr/styles'
import '~/styles/main.scss'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => {
    const appName = usePage<SharedProps>().props.appName
    return [title, appName]
      .filter(Boolean)
      .join(' | ')
  },

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
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)

    // Initialize DSFR
    app.use(VueDsfr)
    app.use(pinia)
    app.use(plugin)

    // Get config values from the page props
    const initialPageProps = props.initialPage.props as Partial<SharedProps>
    const appEnv = initialPageProps.appEnv ?? 'development'
    const matomoHost = initialPageProps.matomoUrl ?? null
    const matomoSiteId = initialPageProps.matomoSiteId
      ? Number.parseInt(initialPageProps.matomoSiteId, 10)
      : null

    // Only initialize Matomo in production
    // Other environments (development, test, staging) should not send events
    if (matomoHost !== null && matomoSiteId !== null && appEnv === 'production') {
      app.use(VueMatomo, {
        host: matomoHost,
        siteId: matomoSiteId,
      })

      // Required for cross-site iframe embedding
      // Type assertion needed: Matomo's _paq is an external library without TypeScript definitions
      ;(window as any)._paq.push(['setCookieSameSite', 'None'])
    }

    // Register icon collections
    for (const collection of collections) {
      addCollection(collection)
    }

    // Set custom loader to catch missing icons and prevent API fetching
    // This will throw an error in development if an icon is not bundled
    setCustomIconLoader((name, prefix) => {
      const errorMessage = `[Missing Icon] Icon "${prefix}:${name}" is not bundled. Run "pnpm detect:icons && pnpm build:icons" to bundle it.`
      console.error(errorMessage)
      // Return null to prevent API fetch, icon will not render
      return null
    }, 'ri')

    // Replace RouterLink with a custom component that uses Inertia's Link
    app.component('RouterLink', RouterLink)
    app.mount(el)
  },
})
