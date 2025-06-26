<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'
import PageForm from '~/components/admin/PageForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Pages', to: '/admin/pages' },
  { text: 'Créer une page', to: '/admin/pages/create' },
])

function handleSubmit(form: PageFormType) {
  form.post('/admin/pages', {
    preserveScroll: true,
  })
}
function handleCancel() {
  router.visit('/admin/pages')
}
</script>

<template>
  <Head title="Créer une page | Admin" />
  <AdminPageHeading title="Créer une page" />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <PageForm
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
