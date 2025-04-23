<script lang="ts" setup>
import { onMounted } from 'vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import DefaultLayout from '../../layouts/default.vue'
import BrandBackgroundContainer from '../../components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '../../components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '../../components/layout/SectionContainer.vue'
import { DsfrCard } from '@gouvminint/vue-dsfr'

defineProps<{
  simulateurs: Array<{
    id: string
    titre: string
    description: string
  }>
}>()

onMounted(() => {
  const { setBreadcrumbs } = useBreadcrumbStore()
  setBreadcrumbs([
    { text: 'Accueil', to: '/' },
    { text: 'Simulateurs', to: '/simulateurs' },
  ])
})
</script>

<template>
  <Head
    title="Liste des simulateurs | Aides simplifiées"
    description="Découvrez les simulateurs vous permettant de découvrir si vous pouvez bénéficier d'aides."
  />
  <DefaultLayout>
    <BrandBackgroundContainer>
      <BreadcrumbSectionContainer />
      <SectionContainer type="page-header">
        <div class="fr-grid-row fr-grid-row--gutters">
          <h1 class="fr-col-12">Simulateurs</h1>
          <template v-for="simulateur in simulateurs" :key="simulateur.id">
            <div class="fr-col-12 fr-col-sm-6 fr-col-md-4">
              <DsfrCard
                :title="simulateur.title"
                :description="simulateur.description"
                :link="`/simulateurs/${simulateur.id}`"
              />
            </div>
          </template>
        </div>
      </SectionContainer>
    </BrandBackgroundContainer>
  </DefaultLayout>
</template>
