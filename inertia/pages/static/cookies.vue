<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import MatomoOptOut from '~/components/MatomoOptOut.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Cookies', to: '/cookies' },
])
</script>

<template>
  <Head
    title="Cookies | Aides simplifiées"
    description="Gérez vos préférences de cookies pour une expérience optimale sur notre site."
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-full">
      <h1>
        Cookies
      </h1>
      <p>
        Nous utilisons des cookies pour améliorer votre expérience et les services disponibles sur ce site. Pour en savoir plus, visitez la page <a href="/donnees-personnelles">Politique de confidentialité et données personnelles</a>. Vous pouvez, à tout moment, avoir le contrôle sur les cookies que vous souhaitez activer.
      </p>
      <MatomoOptOut />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
