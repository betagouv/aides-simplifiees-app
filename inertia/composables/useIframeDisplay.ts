import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

/**
 * Détecte si l'application est affichée dans un iframe et récupère les options d'affichage
 */
export function useIframeDisplay() {
  // Récupère les informations de la page courante via Inertia
  const page = usePage()

  // Fonction pour détecter si on est dans un iframe
  const isInIframe = () => {
    // Vérification côté client uniquement
    if (typeof window !== 'undefined') {
      try {
        return window.self !== window.top
      } catch (e) {
        // Si une erreur d'accès se produit, c'est généralement parce que nous sommes dans un iframe
        return true
      }
    }
    // Côté serveur on suppose que non
    return false
  }

  // Détection d'iframe avec vérification SSR
  const isIframe = computed(() => {
    // Vérification basée sur l'URL (si ?embed=true est présent)
    if (page.props.route?.query?.embed === 'true') {
      return true
    }

    // Vérification basée sur la détection du DOM (côté client uniquement)
    return isInIframe()
  })

  // Options d'affichage
  const displayOption = computed(() => {
    return page.props.route?.query?.['data-display-option'] || ''
  })

  return {
    isIframe,
    displayOption,
  }
}
