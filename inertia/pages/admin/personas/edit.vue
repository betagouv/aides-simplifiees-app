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
    persona,
    simulateur,
  },
} = usePage<InferPageProps<AdminPersonaController, 'edit'>>()

const pageTitle = `Modifier le persona « ${persona.name} »`

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
  { text: simulateur.title, to: `/admin/simulateurs/${simulateur.id}/edit` },
  { text: 'Personas', to: `/admin/simulateurs/${simulateur.id}/personas` },
  { text: pageTitle, to: `/admin/simulateurs/${simulateur.id}/personas/${persona.id}/edit` },
])

function handleSubmit(form: any) {
  form.put(`/admin/simulateurs/${simulateur.id}/personas/${persona.id}`)
}

function handleCancel() {
  router.visit(`/admin/simulateurs/${simulateur.id}/personas`)
}
</script>

<template>
  <Head :title="`${pageTitle} | Admin`" />
  <AdminPageHeading
    highlighted-title="Modifier le persona"
    :title="`« ${persona.name} »`"
  />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <PersonaForm
        :simulateur="simulateur"
        :default-values="persona"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
