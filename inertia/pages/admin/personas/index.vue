<script setup lang="ts">
import type AdminPersonaController from '#controllers/admin/admin_persona_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminItemsListContainer.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    personas,
    simulateur,
  },
} = usePage<InferPageProps<AdminPersonaController, 'index'>>()

const pageTitle = `Personas pour ${simulateur.title}`

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
  { text: simulateur.title, to: `/admin/simulateurs/${simulateur.id}/edit` },
  { text: 'Personas', to: `/admin/simulateurs/${simulateur.id}/personas` },
])
</script>

<template>
  <Head :title="`${pageTitle} | Admin`" />
  <AdminPageHeading
    highlighted-title="Administration des personas"
    :title="`« ${simulateur.title} »`"
  />
  <AdminListContainer
    :title="pageTitle"
    entity-name="persona"
    inertia-props-name="personas"
    entity-gender="m"
    entity-name-plural="personas"
    :create-path="`/admin/simulateurs/${simulateur.id}/personas/create`"
    :edit-path-prefix="`/admin/simulateurs/${simulateur.id}/personas`"
    :view-path-prefix="`/admin/simulateurs/${simulateur.id}/personas`"
    :delete-path-prefix="`/admin/simulateurs/${simulateur.id}/personas`"
    url-segment-id="id"
    :items="personas.map((persona: any) => ({
      id: persona.id,
      title: persona.name,
      status: persona.status,
      updatedAt: persona.updatedAt,
      description: persona.description,
    }))"
    layout="table"
  />
</template>
