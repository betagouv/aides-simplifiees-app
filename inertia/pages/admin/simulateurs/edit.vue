<script setup lang="ts">
import type AdminController from '#controllers/admin_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router, usePage } from '@inertiajs/vue3'
import SimulateurForm from '~/components/admin/SimulateurForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<AdminController, 'renderEditSimulateur'>>()
console.log(simulateur)
const pageTitle = `Modifier le simulateur « ${simulateur.title} »`

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
  { text: pageTitle, to: `/admin/simulateurs/${simulateur.id}/edit` },
])

function handleSubmit(form: SimulateurForm) {
  form.put(`/admin/simulateurs/${simulateur.id}`, {
    preserveScroll: true,
  })
}

function handleCancel() {
  router.visit('/admin/simulateurs')
}
</script>

<template>
  <Head :title="`${pageTitle} | Admin`" />
  <AdminPageHeading
    highlighted-title="Modifier le simulateur"
    :title="`« ${simulateur.title} »`"
    :updated-at="simulateur.updatedAt"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <SimulateurForm
        :default-values="simulateur"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
