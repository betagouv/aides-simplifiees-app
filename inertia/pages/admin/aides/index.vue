<script setup lang="ts">
import type AdminController from '#controllers/admin_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminListContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aides,
  },
} = usePage<InferPageProps<AdminController, 'renderPublicAidesList'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Aides', to: '/admin/aides' },
])
</script>

<template>
  <Head title="Aides | Administration" />
  <AdminListContainer
    title="Administration des aides"
    entity-name="une aide"
    entity-gender="f"
    entity-name-plural="aides"
    create-path="/admin/aides/create"
    edit-path-prefix="/admin/aides"
    view-path-prefix="/aides"
    delete-path-prefix="/admin/aides"
    :items="aides"
  />
</template>
