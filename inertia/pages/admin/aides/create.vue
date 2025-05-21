<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'
import AideForm from '~/components/admin/AideForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Aides', to: '/admin/aides' },
  { text: 'Créer une aide', to: '/admin/aides/create' },
])

function handleSubmit(form: AideForm) {
  form.post('/admin/aides', {
    preserveScroll: true,
  })
}
function handleCancel() {
  router.visit('/admin/aides')
}
</script>

<template>
  <Head title="Créer une aide | Admin" />
  <AdminPageHeading title="Créer une aide" />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <AideForm
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
