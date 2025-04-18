<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import DefaultLayout from '../../../layouts/default.vue'
import BrandBackgroundContainer from '../../../components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '../../../components/layout/SectionContainer.vue'
import BreadcrumbSectionContainer from '../../../components/layout/BreadcrumbSectionContainer.vue'

const props = defineProps({
  page: Object,
  content: String,
})

onMounted(() => {
  // Set breadcrumbs
  const { setBreadcrumbs } = useBreadcrumbStore()
  setBreadcrumbs([
    { text: 'Accueil', to: '/' },
    { text: props.page?.title || props.page?.slug, to: `/content/${props.page?.slug}` },
  ])
})
</script>

<template>
  <Head
    :title="`${page?.title} | Aides simplifiées`"
    :description="
      page?.meta_description
        ? `${page.meta_description.slice(0, 155)}...`
        : `Informations sur ${page?.title || page?.slug}`
    "
  />
  <DefaultLayout>
    <template v-if="!page">
      <div>Contenu introuvable</div>
    </template>
    <template v-else>
      <BrandBackgroundContainer textured subtle>
        <BreadcrumbSectionContainer />
        <SectionContainer type="page-header">
          <article>
            <header class="fr-mb-4w">
              <h1>{{ page.title }}</h1>
            </header>
            <div v-html="content" />
          </article>
        </SectionContainer>
      </BrandBackgroundContainer>
    </template>
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
