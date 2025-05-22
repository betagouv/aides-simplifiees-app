<script lang="ts" setup>
import type PageController from '#controllers/content/page_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import HtmlContent from '~/components/layout/HtmlContent.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    page,
    html,
  },
} = usePage<InferPageProps<PageController, 'show'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: page.title, to: `/content/${page.slug}` },
])
</script>

<template>
  <Head
    :title="page.title"
    :description="page.metaDescription ?? page.description ?? ''"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-full">
      <HtmlContent
        v-if="page"
        :title="page.title"
        :updated-at="page.updatedAt"
        :html="html"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
