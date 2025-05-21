<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'
import NotionForm from '~/components/admin/NotionForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Notions', to: '/admin/notions' },
  { text: 'Créer une notion', to: '/admin/notions/create' },
])

function handleSubmit(form: NotionForm) {
  form.post('/admin/notions', {
    preserveScroll: true,
  })
}

function handleCancel() {
  router.visit('/admin/notions')
}
</script>

<template>
  <Head title="Créer une notion | Admin" />
  <AdminPageHeading title="Créer une notion" />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <NotionForm
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
