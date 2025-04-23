<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

// Define props based on ContentController.showNotion
const props = defineProps<{
  type: string
  item: {
    id: string
    slug: string
    title: string
    description: string
    content: string
  }
  html: string
}>()

const { setBreadcrumbs } = useBreadcrumbStore()

setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Notions', to: '/notions' },
  { text: props.item.title, to: `/notions/${props.item.slug}` },
])
</script>

<template>
  <Head
    :title="`Informations sur la ${type} '${item.title}' | Aides simplifiées`"
    :description="
      item.description
        || `Découvrez toutes les informations sur la ${type} '${item.title}' pour vous accompagner dans vos démarches.`
    "
  />
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer
      v-if="item"
      type="page-header"
    >
      <article>
        <header class="fr-mb-4w">
          <h1>
            {{ item.title }}
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

/* Adjustments for dark mode, if your app supports it */
.dark-mode :deep(thead),
.dark-mode :deep(th),
.dark-mode :deep(td),
.dark-mode :deep(tbody tr) {
  border-color: var(--border-default-grey-dark, #666);
}
</style>
