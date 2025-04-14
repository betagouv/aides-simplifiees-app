/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createSSRApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp, Link } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Import DSFR styles and components
import '@gouvfr/dsfr/dist/dsfr.min.css'
import '@gouvfr/dsfr/dist/utility/utility.min.css'
import VueDsfr from '@gouvminint/vue-dsfr'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `../pages/${name}.vue`,
      import.meta.glob<DefineComponent>('../pages/**/*.vue')
    )
  },

  setup({ el, App, props, plugin }) {
    const app = createSSRApp({ render: () => h(App, props) })
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)

    // Initialize DSFR
    app.use(VueDsfr)
    app.use(pinia)
    app.use(plugin)

    // Replace RouterLink with a custom component that uses Inertia's Link
    app.component('RouterLink', {
      props: {
        to: {
          type: [String, Object],
          required: true
        },
        // Add other props that RouterLink might have
        replace: Boolean,
        append: Boolean,
        download: [Boolean, String],
        target: String,
        rel: String,
      },
      setup(props, { slots }) {
        // Convert 'to' prop to 'href' for Inertia Link
        const href = typeof props.to === 'string' ? props.to : props.to.path || ''
        return () => h(Link, {
          href: href,
          replace: props.replace,
          // Map other relevant props here
        }, slots)
      }
    })
    app.mount(el)
  },
})
