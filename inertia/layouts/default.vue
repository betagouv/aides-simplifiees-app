<script setup lang="ts">
import { DsfrHeader, DsfrFooter, DsfrSkipLinks, DsfrNavigation, DsfrNotice, DsfrFooterLinkList } from '@gouvminint/vue-dsfr'
import { Link, router as inertiaRouter } from '@inertiajs/vue3'
import SchemeModal from '../components/SchemeModal.vue'
import { useSchemeStore } from '~/stores/scheme'
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Browser detection for SSR
const isBrowser = typeof window !== 'undefined'

// Keep track of the current path
const currentPath = ref('/')

// Helper function to create button-style links
const createButtonLink = (label: string, path: string) => {
  return {
    label,
    button: true,
    class: '',
    onclick: () => {
      if (isBrowser) {
        inertiaRouter.visit(path)
      }
    }
  }
}

// Initialize with an empty array but with the correct type
const afterMandatoryLinks = ref<Array<{
  label: string,
  button?: boolean,
  class?: string,
  onclick?: () => void,
  to?: string
}>>([]);

// Update the current path when mounted and listen for changes
onMounted(() => {
  // Initialize with the current path
  currentPath.value = window.location.pathname

  // Set the footer button in a browser context
  afterMandatoryLinks.value = [
    // All links as buttons with Inertia navigation
    createButtonLink('Accessibilité : non conforme', '/content/accessibilite'),
    createButtonLink('Mentions légales', '/content/mentions-legales'),
    createButtonLink('Données personnelles', '/content/donnees-personnelles'),
    createButtonLink('Gestion des cookies', '/content/cookies'),
    createButtonLink('CGU', '/content/cgu'),
    createButtonLink('Statistiques', '/statistiques')
  ];

  // Listen for Inertia navigation events
  const updatePath = () => {
    currentPath.value = window.location.pathname
  }

  document.addEventListener('inertia:navigate', updatePath)

  // Clean up the event listener when component unmounts
  onUnmounted(() => {
    document.removeEventListener('inertia:navigate', updatePath)
  })
})

// Function to safely open the scheme modal
const openSchemeModal = () => {
  if (isBrowser) {
    console.log('Opening scheme modal')
    const store = useSchemeStore()
    store.openModal()
  }
}

// Function to check if a route is active
const isActive = (path: string): boolean => {
  // Special case for home page - only active when exactly at root
  if (path === '/') {
    return currentPath.value === '/'
  }

  return currentPath.value.startsWith(path)
}

// Function to check if a route is exactly active
const isExactActive = (path: string): boolean => {
  return currentPath.value === path
}

const skipLinks = [
  {
    id: 'content',
    text: 'Accéder au contenu',
  },
  {
    id: 'footer',
    text: 'Accéder au pied de page',
  },
]

const navItems = [
  {
    text: 'Accueil',
    to: '/',
  },
  {
    text: 'Partenaires',
    to: '/partenaires',
  },
  {
    text: 'Intégrer nos simulateurs',
    to: '/integrer-nos-simulateurs',
  },
  {
    text: 'Contact',
    to: '/contact',
  },
  {
    text: 'Qui sommes-nous ?',
    to: 'https://beta.gouv.fr/startups/droit-data-gouv-fr-simulateurs-de-droits.html',
    target: '_blank',
  },
]

const noticeMessage = 'Ce site est en cours de développement. Certaines fonctionnalités peuvent ne pas être disponibles ou ne pas fonctionner correctement.'

// Use computed for quickLinks to ensure the handler is always fresh
const quickLinks = computed(() => [
  {
    label: 'Affichage',
    icon: { name: 'ri-sun-line', ssr: true },
    button: true,
    onClick: openSchemeModal,
  },
])
</script>

<template>
  <DsfrSkipLinks :links="skipLinks" />
  <DsfrHeader
    :serviceTitle="'aides simplifiées'"
    :serviceDescription="'La bonne aide, au bon moment, au bon endroit'"
    :homeTo="'/'"
    :logoText="['Republique', 'Française']"
    :quickLinks="quickLinks"
  >
    <template #service-title>
      <Link
        href="/"
        class="fr-header__service-title"
      >
        aides simplifiées
      </Link>
    </template>
    <template #mainnav>
      <nav class="fr-nav" role="navigation" aria-label="Menu principal">
        <ul class="fr-nav__list">
          <li
            v-for="(item, index) in navItems"
            :key="index"
            class="fr-nav__item"
          >
            <Link
              v-if="!item.target"
              :href="item.to"
              class="fr-nav__link"
              :class="{
                'router-link-active': isActive(item.to),
                'router-link-exact-active': isExactActive(item.to)
              }"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              data-testid="nav-inertia-link"
            >
              {{ item.text }}
            </Link>
            <a
              v-else
              :href="item.to"
              class="fr-nav__link"
              :target="item.target"
              rel="noopener"
            >
              {{ item.text }}
            </a>
          </li>
        </ul>
      </nav>
    </template>
  </DsfrHeader>
  <DsfrNotice
    v-if="noticeMessage"
    :title="noticeMessage"
  />
  <main
    id="content"
    role="main"
    tabindex="-1"
  >
    <slot />
  </main>

  <DsfrFooter
    id="footer"
    tabindex="-1"
    a11yCompliance="non conforme"
    :descText="'Aides simplifiées : la bonne aide, au bon moment, au bon endroit'"
    :logoText="['Republique', 'Française']"
    operatorTo="/"
    operatorLinkText="Retour à l'accueil"
    licenceText="Licence ouverte 2.0"
    licenceName="licence ouverte 2.0"
    licenceTo="https://www.etalab.gouv.fr/licence-ouverte-open-licence/"
    :mandatoryLinks="[]"
    :afterMandatoryLinks="afterMandatoryLinks"
  >
  </DsfrFooter>
  <SchemeModal />
</template>
