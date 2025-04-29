<script lang="ts" setup>
import type DynamicContentController from '#controllers/dynamic_content_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aide,
    html,
  },
} = usePage<InferPageProps<DynamicContentController, 'showAide'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Aides', to: '/aides' },
  { text: aide.title, to: `/aides/${aide.slug}` },
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
