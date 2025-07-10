<script setup lang="ts">
import type AdminPageController from '#controllers/admin/admin_page_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminItemsListContainer.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    pages,
  },
} = usePage<InferPageProps<AdminPageController, 'index'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Pages', to: '/admin/pages' },
])
</script>

<template>
  <Head title="Pages | Administration" />
  <AdminPageHeading
    title="Administration des pages"
  />
  <AdminListContainer
    title="Administration des pages"
    entity-name="page"
    entity-gender="f"
    inertia-props-name="pages"
    entity-name-plural="pages"
    create-path="/admin/pages/create"
    edit-path-prefix="/admin/pages"
    view-path-prefix="/content"
    delete-path-prefix="/admin/pages"
    :items="pages"
    has-public-single-view
  />
</template>
