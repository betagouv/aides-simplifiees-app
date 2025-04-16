<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})

const { data: simulateurs } = await useAsyncData('simulateurs', () => {
  return queryCollectionNavigation('simulateurs', ['titre', 'description', 'status'])
}, {
  transform: (data) => {
    const simulateurs = data?.[0]?.children || []
    return simulateurs
      .filter(simulateur => simulateur.status === 'published')
      .map((simulateur) => {
        return {
          id: simulateur.path.split('/').pop(),
          titre: simulateur.titre as string,
          description: simulateur.description as string
        }
      })
  }
})

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
])

useSeoMeta({
  title: 'Liste des simulateurs | Aides simplifiées',
  description: 'Découvrez les simulateurs vous permettant de découvrir si vous pouvez bénéficier d\'aides.'
})
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
