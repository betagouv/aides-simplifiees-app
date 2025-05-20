<script setup lang="ts">
import type AdminController from '#controllers/admin_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrButton, DsfrModal } from '@gouvminint/vue-dsfr'
import { Head, router, usePage } from '@inertiajs/vue3'
import { ref } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    simulateurs,
  },
} = usePage<InferPageProps<AdminController, 'listSimulateurs'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
])

const simulateurToDelete = ref<number | null>(null)
const showConfirmDialog = ref(false)

function confirmDelete(id: number) {
  simulateurToDelete.value = id
  showConfirmDialog.value = true
}

function closeDialog() {
  showConfirmDialog.value = false
  simulateurToDelete.value = null
}

function deleteSimulateur() {
  if (simulateurToDelete.value) {
    router.delete(`/admin/simulateurs/${simulateurToDelete.value}`, {
      preserveScroll: true,
      onFinish: () => closeDialog(),
    })
  }
}
</script>

<template>
  <Head title="Simulateurs | Administration" />
  <BrandBackgroundContainer
    textured
    contrast
  >
    <BreadcrumbSectionContainer contrast />
    <SectionContainer type="page-header">
      <h1 class="brand-contrast-text">
        Administration des simulateurs
      </h1>
    </SectionContainer>
  </BrandBackgroundContainer>

  <BrandBackgroundContainer
    textured
    subtle
  >
    <!-- Boîte de dialogue de confirmation -->
    <DsfrModal
      :opened="showConfirmDialog"
      title="Confirmer la suppression"
      @close="closeDialog"
    >
      <template #content>
        <p>Êtes-vous sûr de vouloir supprimer ce simulateur ? Cette action est irréversible.</p>
      </template>
      <template #footer>
        <div class="fr-btns-group fr-btns-group--right fr-btns-group--inline">
          <DsfrButton
            label="Annuler"
            secondary
            :on-click="closeDialog"
          />
          <DsfrButton
            label="Supprimer"
            warning
            :on-click="deleteSimulateur"
          />
        </div>
      </template>
    </DsfrModal>
    <SectionContainer type="page-block">
      <div class="fr-grid-row fr-grid-row--right fr-mb-2w">
        <DsfrButton
          label="Créer un simulateur"
          icon="fr-icon-add-line"
          :on-click="
            () => {
              router.visit(`/admin/simulateurs/create`)
            }
          "
        />
      </div>

      <div class="fr-grid-row fr-mb-3w">
        <h2>
          Liste des simulateurs
        </h2>
      </div>

      <div
        v-if="simulateurs.length === 0"
        class="fr-alert fr-alert--info"
      >
        <p>Aucun simulateur trouvé</p>
      </div>

      <div class="fr-grid-row fr-grid-row--gutters">
        <div
          v-for="simulateur in simulateurs"
          :key="simulateur.id"
          class="fr-col-12 fr-col-md-6 fr-col-lg-4"
        >
          <!-- <div class="fr-col-8">
          <h3>
            {{ simulateur.title }}
          </h3>
          <DsfrBadge
            :label="simulateur.status"
            small
          />
          <span class="fr-text--sm fr-hint-text">Mise à jour: {{ new Date(simulateur.updatedAt).toLocaleDateString() }}</span>
        </div>
        <div class="fr-col-4">
          <DsfrButtonGroup
            inline-layout-when="always"
            :buttons="[
              {
                iconOnly: true,
                label: 'Éditer',
                onClick: () => router.visit(`/admin/simulateurs/${simulateur.id}/edit`),
                icon: { name: 'ri:edit-line', ssr: true },
                secondary: true,
              },
              {
                iconOnly: true,
                label: 'Voir',
                onClick: () => router.visit(`/simulateurs/${simulateur.slug}`),
                icon: { name: 'ri:eye-line', ssr: true },
                secondary: true,
              },
              {
                iconOnly: true,
                secondary: true,
                label: 'Supprimer',
                onClick: () => confirmDelete(simulateur.id),
                icon: { name: 'ri:delete-bin-2-line', ssr: true },
              },
            ]"
          />
        </div> -->
          <DsfrCard
            :badges="[
              {
                label: simulateur.status,
                small: true,
              },
            ]"
            :title="simulateur.title"
            :description="simulateur.description"
            :status="simulateur.status"
            :updated-at="simulateur.updatedAt"
            :buttons="[
              {
                label: 'Éditer',
                icon: { name: 'ri:edit-line', ssr: true },
                iconOnly: true,
                onClick: () => router.visit(`/admin/simulateurs/${simulateur.id}/edit`),
              },
              {
                label: 'Voir',
                icon: { name: 'ri:eye-line', ssr: true },
                iconOnly: true,
                onClick: () => router.visit(`/simulateurs/${simulateur.slug}`),
                secondary: true,
              },
              {
                label: 'Supprimer',
                icon: { name: 'ri:delete-bin-2-line', ssr: true },
                iconOnly: true,
                secondary: true,
                onClick: () => confirmDelete(simulateur.id),
              },
            ]"
          />
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped>
</style>
