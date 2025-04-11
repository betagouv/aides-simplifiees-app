import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

interface Breadcrumb {
  text: string
  to: RouteLocationRaw
}
export const useBreadcrumbStore = defineStore('breadcrumbs', () => {
  const breadcrumbs = ref<Breadcrumb[]>([])

  const setBreadcrumbs = (newBreadcrumbs: Breadcrumb[]) => {
    breadcrumbs.value = newBreadcrumbs
  }

  return {
    breadcrumbs,
    setBreadcrumbs
  }
})
