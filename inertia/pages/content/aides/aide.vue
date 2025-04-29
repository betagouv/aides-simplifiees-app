<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const props = defineProps<{
  aide: {
    id: number
    title: string
    slug: string
    type: string
    usage: string
    instructeur: string
    description: string
    content: string
    textesLoi?: Array<{ prefix: string, label: string, url: string }>
  }
  html: string
}>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Aides', to: '/aides' },
  { text: props.aide.title, to: `/aides/${props.aide.slug}` },
])
</script>

<template>
  <Head
    :title="`Aide '${aide.title}'`"
    :description="
      aide.description
        || `Découvrez toutes les informations sur l'aide '${aide.title}' pour vous accompagner dans vos démarches.`
    "
  />
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer
      v-if="aide"
      type="page-header"
    >
      <article class="brand-html-content">
        <header class="fr-mb-4w">
          <h1>
            {{ aide.title }}
          </h1>
        </header>
        <div v-html="html" />
      </article>
    </SectionContainer>
  </BrandBackgroundContainer>
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

:deep(th),
:deep(td) {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-default-grey);
}
</style>
