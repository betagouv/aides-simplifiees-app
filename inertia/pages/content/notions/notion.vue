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
    notion,
    html,
  },
} = usePage<InferPageProps<DynamicContentController, 'renderNotion'>>()

const { setBreadcrumbs } = useBreadcrumbStore()

setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Notions', to: '/notions' },
  { text: notion.title, to: `/notions/${notion.slug}` },
])
</script>

<template>
  <Head
    :title="notion.title"
    :description="notion.metaDescription ?? notion.description ?? ''"
  />
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer
      v-if="notion"
      type="page-full"
    >
      <HtmlContent
        v-if="notion"
        :title="notion.title"
        :updated-at="notion.updatedAt"
        :html="html"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
