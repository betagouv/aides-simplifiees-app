<script lang="ts" setup>
import type AideController from '#controllers/content/aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AideCard from '~/components/aides/AideCard.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aides,
  },
} = usePage<InferPageProps<AideController, 'index'>>()
const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Aides', to: '/aides' },
])
</script>

<template>
  <Head
    title="Toutes les aides disponibles"
    description="Découvrez toutes les aides disponibles pour vous accompagner dans vos démarches."
  />
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-header">
      <div class="fr-grid-row fr-grid-row--gutters">
        <h1 class="fr-col-12">
          Aides
        </h1>
        <template
          v-for="aide in aides"
          :key="aide.id"
        >
          <div class="fr-col-12 fr-col-sm-6 fr-col-md-4">
            <AideCard
              :title="aide.title"
              :description="aide.description || ''"
              :link="`/aides/${aide.slug}`"
              :instructeur="aide.instructeur"
              :type-aide="aide.typeAide"
              :usage="aide.usage"
            />
          </div>
        </template>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
