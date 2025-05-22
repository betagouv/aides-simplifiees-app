<script setup lang="ts">
import type AdminPageController from '#controllers/admin/admin_page_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router, usePage } from '@inertiajs/vue3'
import PageForm from '~/components/admin/PageForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    page,
  },
} = usePage<InferPageProps<AdminPageController, 'edit'>>()

const pageTitle = `Modifier la page « ${page.title} »`

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Pages', to: '/admin/pages' },
  { text: pageTitle, to: `/admin/pages/${page.id}/edit` },
])

function handleSubmit(form: PageForm) {
  form.put(`/admin/pages/${page.id}`, {
    preserveScroll: true,
  })
}
function handleCancel() {
  router.visit('/admin/pages')
}
</script>

<template>
  <Head :title="`${pageTitle} | Admin`" />
  <AdminPageHeading
    highlighted-title="Modifier la page"
    :title="`« ${page.title} »`"
    :updated-at="page.updatedAt"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <PageForm
        :default-values="page"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
