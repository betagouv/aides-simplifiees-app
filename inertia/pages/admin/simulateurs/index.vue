<script setup lang="ts">
import type AdminController from '#controllers/admin_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminListContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    simulateurs,
  },
} = usePage<InferPageProps<AdminController, 'renderListSimulateurs'>>()

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
    create-path="/admin/simulateurs/create"
    edit-path-prefix="/admin/simulateurs"
    view-path-prefix="/simulateurs"
    delete-path-prefix="/admin/simulateurs"
    :items="simulateurs"
  />
</template>
