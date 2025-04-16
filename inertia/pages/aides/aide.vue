<script lang="ts" setup>
import { onMounted } from 'vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import DefaultLayout from '../../layouts/default.vue'
import BrandBackgroundContainer from '../../components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '../../components/layout/SectionContainer.vue'
import BreadcrumbSectionContainer from '../../components/layout/BreadcrumbSectionContainer.vue'

// Define props based on what's passed from ContentController.showAide
const props = defineProps<{
  aide: {
    id: number,
    title: string,
    slug: string,
    type: string,
    usage: string,
    instructeur: string,
    description: string,
    content: string,
    textesLoi?: Array<{ prefix: string; label: string; url: string }>
  },
  html: string
}>()

onMounted(() => {
  const { setBreadcrumbs } = useBreadcrumbStore()
  setBreadcrumbs([
    { text: 'Accueil', to: '/' },
    { text: 'Aides', to: '/aides' },
    { text: props.aide.title, to: `/aides/${props.aide.slug}` }
  ])
})
</script>

<template>
  <Head
    :title="`Aide '${aide.title}' | Aides simplifiées`"
    :description="aide.description || `Découvrez toutes les informations sur l'aide '${aide.title}' pour vous accompagner dans vos démarches.`"
  />
  <DefaultLayout>
    <BrandBackgroundContainer>
      <BreadcrumbSectionContainer />
      <SectionContainer
        v-if="aide"
        type="page-header"
      >
        <article>
          <header class="fr-mb-4w">
            <h1>
              {{ aide.title }}
            </h1>
          </header>
          <div v-html="html"></div>

          <!-- Display textes de loi if available -->
          <div v-if="aide.textesLoi && aide.textesLoi.length > 0" class="fr-mt-4w">
            <h2>Textes de loi associés</h2>
            <ul>
              <li v-for="(texte, index) in aide.textesLoi" :key="index">
                <a :href="texte.url" target="_blank" rel="noopener">
                  {{ texte.prefix }} {{ texte.label }}
                </a>
              </li>
            </ul>
          </div>
        </article>
      </SectionContainer>
    </BrandBackgroundContainer>
  </DefaultLayout>
</template>

<style scoped lang="scss">
:deep(th) {
  text-align: left !important;
}

:deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

:deep(thead) {
  border-bottom: 2px solid var(--border-default-grey);
}

:deep(tbody tr) {
  border-bottom: 1px solid var(--border-default-grey);

  &:last-child {
    border-bottom: none;
  }
}

:deep(th), :deep(td) {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-default-grey);
}
</style>
