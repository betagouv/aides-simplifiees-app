import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

/**
 * Détecte si l'application est affichée dans un iframe
 */
export function useIframeDisplay() {
  const page = usePage<{
    route?: {
      query?: {
        iframe?: string
      }
    }
  }>()

  const isIframe = computed(() => {
    return page.props.route?.query?.iframe === 'true'
  })

  return {
    isIframe,
  }
}
