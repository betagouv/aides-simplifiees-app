<script lang="ts" setup>
import type DynamicContentController from '#controllers/dynamic_content_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrCard } from '@gouvminint/vue-dsfr'
import { Head, usePage } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    notions,
  },
} = usePage<InferPageProps<DynamicContentController, 'listNotions'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Notions', to: '/notions' },
])
</script>

<template>
  <Head
    title="Toutes les informations sur les notions"
    description="Découvrez toutes les informations sur les notions pour vous accompagner dans vos démarches."
  />
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-header">
      <div class="fr-grid-row fr-grid-row--gutters">
        <h1 class="fr-col-12">
          Notions
        </h1>
        <template
          v-for="notion in notions"
          :key="notion.id || notion.slug"
        >
          <div class="fr-col-4">
            <DsfrCard
              :title="notion.title"
              :description="notion.description || ''"
              :link="`/notions/${notion.slug || notion.id}`"
            />
          </div>
        </template>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
