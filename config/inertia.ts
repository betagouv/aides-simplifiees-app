import type { InferSharedProps } from '@adonisjs/inertia/types'

import { defineConfig } from '@adonisjs/inertia'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    auth: ctx =>
      ctx.inertia.always(() => ({
        user: ctx.auth.user,
      })),
    flash: ctx => ctx.session.flashMessages,
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.ts',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {
    [key: string]: any
    auth?: {
      user: {
        id: number
        email: string
        fullName?: string
      } | null
    }
  }
}
