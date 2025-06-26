<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'
import SimulateurForm from '~/components/admin/SimulateurForm.vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
  { text: `Créer un simulateur`, to: '/admin/simulateurs/create' },
])

function handleSubmit(form: SimulateurFormType) {
  form.post('/admin/simulateurs', {
    preserveScroll: true,
  })
}

function handleCancel() {
  router.visit('/admin/simulateurs')
}
</script>

<template>
  <Head title="Créer un simulateur | Admin" />
  <BrandBackgroundContainer
    textured
    contrast
  >
    <AdminPageHeading title="Créer un simulateur" />
    <BrandBackgroundContainer
      textured
      subtle
    >
      <SectionContainer type="page-footer">
        <SimulateurForm
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </SectionContainer>
    </BrandBackgroundContainer>
  </brandbackgroundcontainer>
</template>
