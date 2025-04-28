<script lang="ts" setup>
import { DsfrCard } from '@gouvminint/vue-dsfr'
import { Head } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

defineProps<{
  simulateurs: Array<{
    slug: string
    title: string
  }>
}>()

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
        <template
          v-if="simulateurs?.length"
        >
          <div
            v-for="simulateur in simulateurs"
            :key="simulateur.slug"
            class="fr-col-12 fr-col-sm-6 fr-col-md-4"
          >
            <DsfrCard
              :title="simulateur.title"
              description=""
              :link="`/simulateurs/${simulateur.slug}`"
            />
          </div>
        </template>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
