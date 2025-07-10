<script setup lang="ts">
import type AdminAideController from '#controllers/admin/admin_aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminItemsListContainer.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aides,
  },
} = usePage<InferPageProps<AdminAideController, 'index'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Aides', to: '/admin/aides' },
])
</script>

<template>
  <Head title="Aides | Administration" />
  <AdminPageHeading
    title="Administration des aides"
  />
  <AdminListContainer
    title="Administration des aides"
    entity-name="une aide"
    inertia-props-name="aides"
    entity-gender="f"
    entity-name-plural="aides"
    create-path="/admin/aides/create"
    edit-path-prefix="/admin/aides"
    view-path-prefix="/aides"
    delete-path-prefix="/admin/aides"
    :items="aides"
    has-public-single-view
  />
</template>
