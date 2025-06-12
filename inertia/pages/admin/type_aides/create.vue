<script lang="ts" setup>
import { Head, router } from '@inertiajs/vue3'
import TypeAideForm from '~/components/admin/TypeAideForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Types d\'aides', to: '/admin/type-aides' },
  { text: 'Créer un type d\'aide', to: '/admin/type-aides/create' },
])

function handleSubmit(form: any) {
  form.post('/admin/type-aides', {
    preserveScroll: true,
  })
}

function handleCancel() {
  router.visit('/admin/type-aides')
}
</script>

<template>
  <Head title="Créer un type d'aide | Admin" />
  <AdminPageHeading title="Créer un type d'aide" />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <TypeAideForm
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
