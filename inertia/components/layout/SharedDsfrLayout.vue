<script setup lang="ts">
import type { SharedProps } from '@adonisjs/inertia/types'
import type { DsfrHeaderMenuLinkProps } from '@gouvminint/vue-dsfr'
import {
  DsfrFooter,
  DsfrHeader,
  DsfrNavigation,
  DsfrNotice,
  DsfrSkipLinks,
} from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import SchemeModal from '~/components/SchemeModal.vue'
import { useSchemeStore } from '~/stores/scheme'

const page = usePage<SharedProps>()
const isAuthenticated = computed(() => {
  return Boolean(page.props.auth?.user)
})

const schemeStore = useSchemeStore()

const noticeMessage = 'Ce site est en cours de développement. Certaines fonctionnalités peuvent ne pas être disponibles ou ne pas fonctionner correctement.'

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

function handleLogout() {
  router.post('/logout', {}, {
    onSuccess: () => {
      // Forcer le rechargement complet de la page après la déconnexion
      window.location.href = '/'
    },
  })
}

const quickLinks = computed(() => {
  const links: DsfrHeaderMenuLinkProps[] = [
    {
      label: 'Affichage',
      icon: { name: 'ri-sun-line', ssr: true },
      button: true,
      onClick: schemeStore.openModal,
    },
  ]

  if (isAuthenticated.value) {
    links.push({
      label: 'Déconnexion',
      icon: { name: 'ri:logout-box-line', ssr: true },
      button: true,
      onClick: () => handleLogout(),
    })
  }
  else {
    /* links.push({
      label: 'Connexion',
      icon: { name: 'ri-login-box-line', ssr: true },
      button: true,
      onClick: () => router.visit('/login'),
    }) */
  }

  return links
})
</script>

<template>
  <DsfrSkipLinks :links="skipLinks" />
  <DsfrHeader
    service-title="aides simplifiées"
    service-description="La bonne aide, au bon moment, au bon endroit"
    home-to="/"
    :logo-text="['Republique', 'Française']"
    :quick-links="quickLinks"
  >
    <template #mainnav>
      <DsfrNavigation
        v-if="navItems?.length > 0"
        :nav-items="navItems"
      />
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
    a11y-compliance="non conforme"
    desc-text="Aides simplifiées : la bonne aide, au bon moment, au bon endroit"
    :logo-text="['Republique', 'Française']"
    operator-to="/"
    operator-link-text="Retour à l'accueil"
    licence-text="Licence ouverte 2.0"
    licence-name="licence ouverte 2.0"
    licence-to="https://www.etalab.gouv.fr/licence-ouverte-open-licence/"
    home-link="/"
    legal-link="/content/mentions-legales"
    personal-data-link="/content/donnees-personnelles"
    cookies-link="/cookies"
    a11y-compliance-link="/content/accessibilite"
    :after-mandatory-links="[
      {
        label: 'CGU',
        to: '/content/cgu',
      },
      {
        label: 'Statistiques',
        to: '/statistiques',
      },
    ]"
  />
  <SchemeModal />
</template>
