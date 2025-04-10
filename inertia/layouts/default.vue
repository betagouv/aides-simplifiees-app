<script setup lang="ts">
import { DsfrHeader, DsfrFooter, DsfrSkipLinks, DsfrNavigation, DsfrNotice } from '@gouvminint/vue-dsfr'

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

// Header and footer configuration
const headerProps = {
  serviceTitle: 'Aides Simplifiées',
  serviceTagline: 'La bonne aide, au bon moment, au bon endroit',
  homePath: '/',
  operatorLogo: {
    alt: 'République Française',
    imgSrc: '/assets/images/republique-francaise-logo.svg',
    orientation: 'horizontal',
  },
}

const footerProps = {
  accessibility: 'partially compliant',
  contentDescription: 'Aides simplifiées vous aide à trouver les aides adaptées à votre situation.',
  bottomItems: [
    {
      text: 'Accessibilité : non conforme',
      to: '/accessibilite',
    },
    {
      text: 'Mentions légales',
      to: '/mentions-legales',
    },
    {
      text: 'Données personnelles',
      to: '/donnees-personnelles',
    },
    {
      text: 'Statistiques',
      to: '/statistiques',
    },
    {
      text: 'Nous contacter',
      to: '/contact',
    },
  ],
  logoAttributes: {
    alt: 'République Française',
    imgSrc: '/assets/images/republique-francaise-logo.svg',
  },
  license: {
    text: 'Sauf mention contraire, tous les contenus de ce site sont sous',
    link: {
      text: 'licence etalab-2.0',
      href: 'https://github.com/etalab/licence-ouverte/blob/master/LO.md',
    },
  },
}
</script>

<template>
  <DsfrSkipLinks :links="skipLinks" />
  <DsfrHeader
    v-if="headerProps"
    v-bind="headerProps"
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
    v-if="footerProps"
    id="footer"
    tabindex="-1"
    v-bind="footerProps"
  />
</template>
