<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrTiles } from '@gouvminint/vue-dsfr'
import { Head, usePage } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    simulateurs,
  },
} = usePage<InferPageProps<SimulateurController, 'index'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
])
</script>

<template>
  <Head
    title="Liste des simulateurs"
    description="Découvrez les simulateurs vous permettant de découvrir si vous pouvez bénéficier d'aides."
  />
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-header">
      <div class="fr-grid-row fr-grid-row--gutters">
        <h1 class="fr-col-12">
          Simulateurs
        </h1>
        <div
          v-for="simulateur in simulateurs"
          :key="simulateur.slug"
          class="fr-col-12 fr-col-sm-6 fr-col-md-4"
        >
          <DsfrTiles
            horizontal
            title-tag="h2"
            :tiles="[
              {
                title: simulateur.title,
                to: `/simulateurs/${simulateur.slug}`,
                svgPath: simulateur.pictogramPath,
              },
            ]"
          />
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
