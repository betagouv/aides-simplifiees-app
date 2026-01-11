declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}

declare module 'vue-matomo'
declare module '@gouvfr/dsfr-chart/dist/DSFRChart/DSFRChart.js'
