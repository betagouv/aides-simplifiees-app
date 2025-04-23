import type { DefineComponent } from 'vue'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, Link } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createSSRApp, h } from 'vue'
import { getLayout } from './shared'

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
        setup(componentProps: any, { slots }: any) {
          // Convert 'to' prop to 'href' for Inertia Link
          const href = typeof componentProps.to === 'string' ? componentProps.to : componentProps.to.path || ''
          return () =>
            h(
              Link,
              {
                href,
                replace: componentProps.replace,
                // Map other relevant props here
              },
              slots,
            )
        },
      })
      return ssrApp
    },
  })
}
