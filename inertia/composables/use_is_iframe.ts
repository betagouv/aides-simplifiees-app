import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import { getParam } from '~/utils/url'

/**
 * Détecte si l'application est affichée dans un iframe
 */
export function useIframeDisplay() {
  const page = usePage()

  const isIframe = computed(() => {
    return getParam(page.url, 'iframe') === 'true'
  })

  return {
    isIframe,
  }
}
