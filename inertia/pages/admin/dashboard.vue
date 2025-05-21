<script setup lang="ts">
import type AdminController from '#controllers/admin_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrCard } from '@gouvminint/vue-dsfr'
import { Head, usePage } from '@inertiajs/vue3'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    items,
  },
} = usePage<InferPageProps<AdminController, 'dashboard'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
])
</script>

<template>
  <Head title="Administration" />
  <AdminPageHeading title="Administration" />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <div class="fr-grid-row fr-grid-row--gutters">
        <div
          v-for="item in items"
          :key="item.name"
          class="fr-col-12 fr-col-md-4"
        >
          <DsfrCard
            :title="item.name"
            :description="item.description"
            :link="item.route"
            :end-detail="`${item.count} items`"
          />
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
