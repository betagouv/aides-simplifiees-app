<script setup lang="ts">
import type AdminController from '#controllers/admin_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminListContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    notions,
  },
} = usePage<InferPageProps<AdminController, 'renderPublicNotionsList'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Notions', to: '/admin/notions' },
])
</script>

<template>
  <Head title="Notions | Administration" />
  <AdminListContainer
    title="Administration des notions"
    entity-name="notion"
    entity-gender="f"
    entity-name-plural="notions"
    create-path="/admin/notions/create"
    edit-path-prefix="/admin/notions"
    view-path-prefix="/notions"
    delete-path-prefix="/admin/notions"
    :items="notions"
  />
</template>
