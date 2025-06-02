<script setup lang="ts">
import type AdminAideController from '#controllers/admin/admin_aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router, usePage } from '@inertiajs/vue3'
import AideForm from '~/components/admin/AideForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aide,
    typesAide,
  },
} = usePage<InferPageProps<AdminAideController, 'edit'>>()

const pageTitle = `Modifier l'aide « ${aide.title} »`

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Aides', to: '/admin/aides' },
  { text: pageTitle, to: `/admin/aides/${aide.id}/edit` },
])

function handleSubmit(form: AideForm) {
  form.put(`/admin/aides/${aide.id}`)
}

function handleCancel() {
  router.visit('/admin/aides')
}
</script>

<template>
  <Head :title="pageTitle" />
  <AdminPageHeading
    highlighted-title="Modifier l'aide"
    :title="`« ${aide.title} »`"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <AideForm
        :types-aide="typesAide"
        :default-values="aide"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
