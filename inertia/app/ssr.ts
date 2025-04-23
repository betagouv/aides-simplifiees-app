import type { DefineComponent } from 'vue'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, Link } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
// import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createSSRApp, h } from 'vue'
import DefaultLayout from '~/layouts/default.vue'
import iframeLayout from '~/layouts/iframe.vue'
import { getParam } from '~/utils/url'

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: renderToString,

    resolve: async (name) => {
      let layout = DefaultLayout

      // Check if the URL contains the 'iframe' query parameter
      if (getParam(page.url, 'iframe') === 'true') {
        layout = iframeLayout
      }

      const ssrPage = await resolvePageComponent(
        `../pages/${name}.vue`,
        import.meta.glob<DefineComponent>('../pages/**/*.vue'),
      )
      ssrPage.default.layout ??= layout
      return ssrPage
    },

    setup({ App, props, plugin }) {
      const pinia = createPinia()
      // pinia.use(piniaPluginPersistedstate)
      const ssrApp = createSSRApp({ render: () => h(App, props) })
        .use(pinia)
        .use(plugin)
        ssrApp.component('RouterLink', {
          props: {
            to: {
              type: [String, Object],
              required: true,
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
            return () =>
              h(
                Link,
                {
                  href,
                  replace: props.replace,
                  // Map other relevant props here
                },
                slots
              )
          },
        })
      return ssrApp
    },
  })
}
