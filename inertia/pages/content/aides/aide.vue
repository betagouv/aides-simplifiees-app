<script lang="ts" setup>
import type DynamicContentController from '#controllers/dynamic_content_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import HtmlContent from '~/components/layout/HtmlContent.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aide,
    html,
  },
} = usePage<InferPageProps<DynamicContentController, 'renderAide'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Aides', to: '/aides' },
  { text: aide.title, to: `/aides/${aide.slug}` },
])
</script>

<template>
  <Head
    :title="aide.title"
    :description="aide.metaDescription ?? aide.description ?? ''"
  />
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer
      v-if="aide"
      type="page-full"
    >
      <HtmlContent
        v-if="aide"
        :title="aide.title"
        :updated-at="aide.updatedAt"
        :html="html"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
