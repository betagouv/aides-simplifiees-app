<script setup lang="ts">
import type AdminPersonaController from '#controllers/admin/admin_persona_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, router, usePage } from '@inertiajs/vue3'
import PersonaForm from '~/components/admin/PersonaForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<AdminPersonaController, 'create'>>()

const pageTitle = `Créer un persona pour ${simulateur.title}`

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
  { text: simulateur.title, to: `/admin/simulateurs/${simulateur.id}/edit` },
  { text: 'Personas', to: `/admin/simulateurs/${simulateur.id}/personas` },
  { text: 'Créer un persona', to: `/admin/simulateurs/${simulateur.id}/personas/create` },
])

function handleSubmit(form: any) {
  form.post(`/admin/simulateurs/${simulateur.id}/personas`)
}

function handleCancel() {
  router.visit(`/admin/simulateurs/${simulateur.id}/personas`)
}
</script>

<template>
  <Head :title="`${pageTitle} | Admin`" />
  <AdminPageHeading
    highlighted-title="Créer un persona"
    :title="`« ${simulateur.title} »`"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <PersonaForm
        :simulateur="simulateur"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
