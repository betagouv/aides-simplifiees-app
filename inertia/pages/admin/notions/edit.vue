<script setup lang="ts">
import type AdminNotionController from '#controllers/admin/admin_notion_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router, usePage } from '@inertiajs/vue3'
import NotionForm from '~/components/admin/NotionForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    notion,
  },
} = usePage<InferPageProps<AdminNotionController, 'edit'>>()

const pageTitle = `Modifier la notion « ${notion.title} »`

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Notions', to: '/admin/notions' },
  { text: pageTitle, to: `/admin/notions/${notion.id}/edit` },
])

function handleSubmit(form: NotionForm) {
  form.put(`/admin/notions/${notion.id}`)
}
function handleCancel() {
  router.visit('/admin/notions')
}
</script>

<template>
  <Head :title="`${pageTitle} | Admin`" />
  <AdminPageHeading
    highlighted-title="Modifier la notion"
    :title="`« ${notion.title} »`"
    :updated-at="notion.updatedAt"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <NotionForm
        :default-values="notion"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
