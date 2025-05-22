<script setup lang="ts">
import type AdminSimulateurController from '#controllers/admin/admin_simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminItemsListContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    simulateurs,
  },
} = usePage<InferPageProps<AdminSimulateurController, 'index'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
])
</script>

<template>
  <Head title="Simulateurs | Administration" />
  <AdminListContainer
    title="Administration des simulateurs"
    entity-name="simulateur"
    entity-name-plural="simulateurs"
    entity-gender="m"
    inertia-props-name="simulateurs"
    create-path="/admin/simulateurs/create"
    edit-path-prefix="/admin/simulateurs"
    view-path-prefix="/simulateurs"
    delete-path-prefix="/admin/simulateurs"
    :items="simulateurs"
  />
</template>
