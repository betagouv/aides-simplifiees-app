<script setup lang="ts">
import type AdminNotionController from '#controllers/admin/admin_notion_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminItemsListContainer.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    notions,
  },
} = usePage<InferPageProps<AdminNotionController, 'index'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Notions', to: '/admin/notions' },
])
</script>

<template>
  <Head title="Notions | Administration" />
  <AdminPageHeading
    title="Administration des notions"
  />
  <AdminListContainer
    title="Administration des notions"
    entity-name="notion"
    entity-gender="f"
    inertia-props-name="notions"
    entity-name-plural="notions"
    create-path="/admin/notions/create"
    edit-path-prefix="/admin/notions"
    view-path-prefix="/notions"
    delete-path-prefix="/admin/notions"
    :items="notions"
    has-public-single-view
  />
</template>
