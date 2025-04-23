<script lang="ts" setup>
import { DsfrCard } from '@gouvminint/vue-dsfr'
import { computed } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const props = defineProps<{
  simulateurs: Array<{
    slug: string
    title: string
  }>
}>()

const simulateurs = computed(() => props.simulateurs
  // .filter(simulateur => simulateur.status === 'published')
  .map((simulateur) => {
    return {
      id: simulateur.slug as string,
      titre: simulateur.title as string,
      description: '',
      // description: simulateur.description as string,
    }
  }),
)

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
])

// useSeoMeta({
//   title: 'Liste des simulateurs | Aides simplifiées',
//   description:
//     'Découvrez les simulateurs vous permettant de découvrir si vous pouvez bénéficier d\'aides.',
// })
</script>

<template>
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-header">
      <div class="fr-grid-row fr-grid-row--gutters">
        <h1 class="fr-col-12">
          Simulateurs
        </h1>
        <template
          v-for="simulateur in simulateurs"
          :key="simulateur.id"
        >
          <div class="fr-col-12 fr-col-sm-6 fr-col-md-4">
            <DsfrCard
              :title="simulateur.titre"
              :description="simulateur.description"
              :link="`/simulateurs/${simulateur.id}`"
            />
          </div>
        </template>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
