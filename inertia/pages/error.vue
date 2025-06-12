<script lang="ts" setup>
import { DsfrErrorPage } from '@gouvminint/vue-dsfr'
import { Head, router } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const props = withDefaults(defineProps<{
  statusCode?: number
  message?: string
}>(), {
  statusCode: 500,
  message: 'Une erreur est survenue, veuillez réessayer plus tard.',
})

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Erreur', to: '/errors' },
])

const errorTitle = `Erreur ${props.statusCode}`
const description = props.statusCode === 404
  ? 'La page que vous cherchez est introuvable. Si vous avez tapé l\'adresse web dans le navigateur, vérifiez qu\'elle est correcte. La page n\'est peut-être plus disponible.'
  : 'Le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement possible.'
</script>

<template>
  <Head
    :title="`${errorTitle} - ${message}`"
    :description="description"
  />

  <BrandBackgroundContainer
    textured
    subtle
  >
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-full">
      <DsfrErrorPage
        :title="errorTitle"
        :subtitle="message"
        :description="description"
        help=""
        :buttons="[
          {
            label: 'Retour à l\'accueil',
            icon: { name: 'ri:arrow-left-line', ssr: true },
            onClick: () => {
              router.visit('/')
            },
          },
        ]"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
