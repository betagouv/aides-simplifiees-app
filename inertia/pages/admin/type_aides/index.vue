<script lang="ts" setup>
import type AdminTypeAideController from '#controllers/admin/admin_type_aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import AdminListContainer from '~/components/admin/AdminItemsListContainer.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    typeAides,
  },
} = usePage<InferPageProps<AdminTypeAideController, 'index'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Types d\'aides', to: '/admin/type-aides' },
])
</script>

<template>
  <Head title="Types d'aides | Administration" />
  <AdminPageHeading
    title="Administration des types d'aides"
  />
  <AdminListContainer
    title="Administration des types d'aides"
    entity-name="un type d'aide"
    inertia-props-name="typeAides"
    entity-gender="m"
    entity-name-plural="types d'aides"
    create-path="/admin/type-aides/create"
    edit-path-prefix="/admin/type-aides"
    view-path-prefix="/admin/type-aides"
    delete-path-prefix="/admin/type-aides"
    :items="typeAides.map(typeAide => ({
      id: typeAide.id,
      title: typeAide.label,
      slug: typeAide.slug,
      status: 'published',
      updatedAt: typeAide.updatedAt,
      description: `Icône: ${typeAide.iconName}`,
    }))"
    layout="table"
  />
</template>
