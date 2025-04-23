import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Breadcrumb {
  text: string
  to: string
}
export const useBreadcrumbStore = defineStore('breadcrumbs', () => {
  const breadcrumbs = ref<Breadcrumb[]>([])

  const setBreadcrumbs = (newBreadcrumbs: Breadcrumb[]) => {
    breadcrumbs.value = newBreadcrumbs
  }

  return {
    breadcrumbs,
    setBreadcrumbs,
  }
})
