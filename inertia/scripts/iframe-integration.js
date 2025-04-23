import iframeResize from '@iframe-resizer/parent'

/**
 * Script d'intégration pour les simulateurs d'aides
 * Permet d'intégrer facilement le simulateur sur un autre site
 */

(function () {
  // S'assurer que le script s'exécute uniquement dans un navigateur
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  // Récupérer le script courant
  const currentScript = document.currentScript
  if (!currentScript) {
    console.error('Impossible de trouver l\'élément de script courant')
    return
  }

  // Récupérer les options d'intégration depuis les attributs data-*

  /**
   * @todo remove default value, right now we keep it to not break existing integrations
   */
  const selectedSimulator = currentScript.dataset.simulateur || 'demenagement-logement'

  if (!selectedSimulator) {
    console.error('Aucun simulateur sélectionné. Veuillez spécifier un simulateur dans l\'attribut data-simulateur.')
    return
  }

  const initialHeight = currentScript.dataset.height || '600px'
  const log = currentScript.dataset.log === 'true'
  const waitForLoad = currentScript.dataset.waitForLoad !== 'false'
  const containerId = currentScript.dataset.containerId || 'aides-simplifiees-iframe-container'

  // Construire l'URL du simulateur
  let baseUrl
  if (currentScript.src.includes('localhost')) {
    // Environnement de développement
    baseUrl = 'http://localhost:3000'
  } else {
    // Extraire l'origine de l'URL du script
    const scriptUrl = new URL(currentScript.src)
    baseUrl = scriptUrl.origin
  }

  const src = new URL(`${baseUrl}/simulateurs/${selectedSimulator}`)

  // Configurer les paramètres
  src.searchParams.set('iframe', 'true')
  src.searchParams.set('utm_source', `iframe@${window.location.hostname}`)
  src.searchParams.set('utm_term', window.location.pathname)

  // Créer l'iframe
  const iframe = document.createElement('iframe')
  const iframeAttributes = {
    id: 'simulateur-aides',
    src: src.toString(),
    title: 'Simulateur d\'aides simplifiées',
    style: `border: none; width: 100%; display: block; height: ${initialHeight}; opacity: 0; transition: opacity 0.5s;`,
    loading: 'lazy',
  }

  // Appliquer les attributs à l'iframe
  for (const key in iframeAttributes) {
    iframe.setAttribute(key, iframeAttributes[key])
  }

  // Insérer l'iframe dans le document
  const container = document.getElementById(containerId)
  if (container) {
    // Priorité au conteneur dédié s'il existe
    container.appendChild(iframe)
  } else if (currentScript.parentElement.tagName === 'HEAD') {
    // Si le script est dans le HEAD et qu'il n'y a pas de conteneur dédié
    console.warn(`Container with id "${containerId}" not found. Creating fallback container.`)
    const fallbackContainer = document.createElement('div')
    fallbackContainer.id = containerId

    const body = document.body || document.querySelector('body')
    if (body) {
      body.appendChild(fallbackContainer)
      fallbackContainer.appendChild(iframe)
    }
  } else {
    // Sinon, insérer après le script courant
    console.warn(`Container with id "${containerId}" not found. Inserting iframe after script.`)
    currentScript.insertAdjacentElement('afterend', iframe)
  }

  // Initialiser iframe-resizer pour ajuster automatiquement la hauteur
  iframeResize(
    {
      license: 'GPLv3',
      log: log ? 'collapsed' : false,
      checkOrigin: false, // À ajuster
      scrolling: 'auto',
      inPageLinks: true,
      waitForLoad,
      onMessage(message) {
        // Possibilité d'ajouter des actions personnalisées basées sur les messages de l'iframe
        if (log) {
          console.log('Message from iframe:', message)
        }

        // Émettre un événement pour permettre aux intégrateurs de réagir aux messages
        const event = new CustomEvent('aides-simplifiees-message', {
          detail: message,
        })
        window.dispatchEvent(event)
      },
      onReady() {
        // L'iframe est complètement chargé et prêt
        iframe.style.opacity = '1'
        if (log) {
          console.log('Iframe is ready')
        }

        // Émettre un événement pour notifier que l'iframe est prêt
        const event = new CustomEvent('aides-simplifiees-ready')
        window.dispatchEvent(event)
      },
    },
    iframe,
  )
})()
