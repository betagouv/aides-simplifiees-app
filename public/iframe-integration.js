/**
 * Script d'intégration pour les simulateurs d'aides
 * Permet d'intégrer facilement le simulateur sur n'importe quel site
 * Usage: <script src="/iframe-integration.js" data-display-option="no-header"></script>
 */

(function () {
  // S'assurer que le script s'exécute uniquement dans un navigateur
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  // Fonction pour charger iframe-resizer depuis le CDN
  function loadIframeResizer (callback) {
    // Vérifier si iframeResizer est déjà chargé
    if (window.iFrameResize) {
      callback(window.iFrameResize)
      return
    }

    // Créer l'élément script pour charger iframeResizer
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.2/js/iframeResizer.js'
    script.async = true
    script.onload = function () {
      if (window.iFrameResize) {
        callback(window.iFrameResize)
      }
      else {
        console.error('Échec du chargement de iframeResizer')
      }
    }
    script.onerror = function () {
      console.error('Échec du chargement de iframeResizer')
    }
    document.head.appendChild(script)
  }

  // Récupérer le script courant
  const currentScript = document.currentScript
  if (!currentScript) {
    console.error('Impossible de trouver l\'élément de script courant')
    return
  }

  // Récupérer les options d'intégration depuis les attributs data-*
  const displayOption = currentScript.dataset.displayOption || 'no-header'
  const selectedSimulator = currentScript.dataset.simulator || 'demenagement-logement'

  // Construire l'URL du simulateur
  let baseUrl
  if (currentScript.src.includes('localhost')) {
    // Environnement de développement
    baseUrl = 'http://localhost:3333'
  }
  else {
    // Extraire l'origine de l'URL du script
    const scriptUrl = new URL(currentScript.src)
    baseUrl = scriptUrl.origin
  }

  const src = new URL(`${baseUrl}/simulateurs/${selectedSimulator}`)

  // Configurer les paramètres
  src.searchParams.set('iframe', 'true')
  src.searchParams.set('data-display-option', displayOption)
  src.searchParams.set('utm_source', `iframe@${window.location.hostname}`)
  src.searchParams.set('utm_term', window.location.pathname)

  // Créer l'iframe
  const iframe = document.createElement('iframe')
  const iframeAttributes = {
    id: 'simulateur-aides',
    src: src.toString(),
    title: 'Simulateur d\'aides simplifiées',
    style: 'border: none; width: 100%; display: block; height: 500px',
    allow: 'clipboard-write',
    allowfullscreen: true,
    webkitallowfullscreen: true,
    mozallowfullscreen: true,
  }

  // Appliquer les attributs à l'iframe
  for (const key in iframeAttributes) {
    iframe.setAttribute(key, iframeAttributes[key])
  }

  // Insérer l'iframe dans le document
  const container = document.getElementById('aides-simplifiees-iframe-container')
  if (container) {
    // Priorité au conteneur dédié s'il existe
    container.appendChild(iframe)
  }
  else if (currentScript.parentElement.tagName === 'HEAD') {
    // Si le script est dans le HEAD et qu'il n'y a pas de conteneur dédié
    const body = document.body || document.querySelector('body')
    if (body) {
      body.appendChild(iframe)
    }
  }
  else {
    // Sinon, insérer après le script courant
    currentScript.insertAdjacentElement('afterend', iframe)
  }

  // Initialiser iframe-resizer pour ajuster automatiquement la hauteur
  loadIframeResizer((iframeResize) => {
    iframeResize(
      {
        license: 'GPLv3',
      },
      iframe
    )
  })
})()
