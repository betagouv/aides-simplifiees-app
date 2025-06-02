<script lang="ts" setup>
import type AdminTypeAideController from '#controllers/admin/admin_type_aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router, usePage } from '@inertiajs/vue3'
import TypeAideForm from '~/components/admin/TypeAideForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    typeAide,
  },
} = usePage<InferPageProps<AdminTypeAideController, 'edit'>>()

const pageTitle = `Modifier le type d'aide « ${typeAide.label} »`
const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Types d\'aides', to: '/admin/type-aides' },
  { text: pageTitle, to: `/admin/type-aides/${typeAide.id}/edit` },
])

function handleSubmit(form: any) {
  form.put(`/admin/type-aides/${typeAide.id}`)
}

function handleCancel() {
  router.visit('/admin/type-aides')
}
</script>

<template>
  <Head :title="pageTitle" />
  <AdminPageHeading
    highlighted-title="Modifier le type d'aide"
    :title="`« ${typeAide.label} »`"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <TypeAideForm
        :default-values="typeAide"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
