<script setup lang="ts">
import type AdminController from '#controllers/admin_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminListContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    pages,
  },
} = usePage<InferPageProps<AdminController, 'renderListPages'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Pages', to: '/admin/pages' },
])
</script>

<template>
  <Head title="Pages | Administration" />
  <AdminListContainer
    title="Administration des pages"
    entity-name="page"
    entity-gender="f"
    entity-name-plural="pages"
    create-path="/admin/pages/create"
    edit-path-prefix="/admin/pages"
    view-path-prefix="/content"
    delete-path-prefix="/admin/pages"
    :items="pages"
  />
</template>
