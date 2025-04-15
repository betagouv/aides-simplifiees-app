<script setup lang="ts">
import { Head, router, Link } from '@inertiajs/vue3'
import DefaultLayout from '../../../layouts/default.vue'
import BrandBackgroundContainer from '../../../components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '../../../components/layout/SectionContainer.vue'
import { ref } from 'vue'

const props = defineProps<{
  notions: {
    id: number,
    title: string,
    slug: string,
    description: string | null,
    category: string | null,
    createdAt: string,
    updatedAt: string
  }[]
}>()

const notionToDelete = ref<number | null>(null)
const showConfirmDialog = ref(false)

const confirmDelete = (id: number) => {
  notionToDelete.value = id
  showConfirmDialog.value = true
}

const closeDialog = () => {
  showConfirmDialog.value = false
  notionToDelete.value = null
}

const deleteNotion = () => {
  console.log('deleteNotion', notionToDelete.value)
  if (notionToDelete.value) {
    router.delete(`/admin/notions/${notionToDelete.value}`, {
      preserveScroll: true,
      onFinish: () => closeDialog()
    })
  }
}
</script>

<template>
  <Head title="Notions | Administration" />

  <DefaultLayout>
    <BrandBackgroundContainer
      textured
      contrast
    >
      <SectionContainer
        type="page-header"
      >
        <h1 class="brand-contrast-text">
          <br>Administration des notions
        </h1>
      </SectionContainer>
    </BrandBackgroundContainer>

    <BrandBackgroundContainer textured subtle>
      <SectionContainer type="page-block">
        <div class="fr-container fr-container--fluid">
          <div class="fr-grid-row fr-grid-row--gutters">
            <div class="fr-col-12">
              <DsfrBreadcrumb
                :links="[
                  { text: 'Administration', to: '/admin' },
                  { text: 'Notions', to: '/admin/notions' }
                ]"
              />
            </div>
          </div>

          <div>
            <div class="fr-grid-row fr-grid-row--right fr-mb-2w">
              <DsfrButton
                label="Créer une notion"
                icon="fr-icon-add-line"
                :onclick="() => {router.visit(`/admin/notions/create`)}"
              />
            </div>

            <h2 class="fr-mb-3w">Liste des notions</h2>

            <div v-if="notions.length === 0" class="fr-alert fr-alert--info">
              <p>Aucune notion trouvée</p>
            </div>

            <div v-else class="notion-list">
              <div v-for="notion in notions" :key="notion.id" class="fr-grid-row fr-grid-row--gutters fr-mb-2w notion-item">
                <div class="fr-col-12 fr-p-2w">
                  <div class="fr-grid-row fr-grid-row--middle">
                    <div class="fr-col-12 fr-col-md-8">
                      <h3 class="fr-mb-0">{{ notion.title }}</h3>
                      <p v-if="notion.description" class="fr-mb-1w fr-text--sm notion-description">
                        {{ notion.description }}
                      </p>
                      <p class="fr-mb-0">
                        <span class="fr-badge fr-badge--sm fr-badge--blue-cumulus fr-mr-1w">#{{ notion.id }}</span>
                        <span class="fr-text--sm fr-mr-1w">Slug: {{ notion.slug }}</span>
                        <span v-if="notion.category" class="fr-badge fr-badge--green-emeraude fr-mr-1w">{{ notion.category }}</span>
                        <span class="fr-text--sm fr-text--italic">Mise à jour: {{ new Date(notion.updatedAt).toLocaleDateString() }}</span>
                      </p>
                    </div>

                    <div class="fr-col-12 fr-col-md-4 fr-grid-row fr-grid-row--right fr-mt-2w fr-mt-md-0">
                      <div class="fr-btns-group fr-btns-group--inline">
                        <DsfrButton
                          label="Éditer"
                          icon="fr-icon-edit-line"
                          size="sm"
                          :onClick="() => {router.visit(`/admin/notions/${notion.id}/edit`)}"
                        />
                        <DsfrButton
                          label="Voir"
                          icon="fr-icon-eye-line"
                          size="sm"
                          secondary
                          :onclick="() => {router.visit(`/notions/${notion.slug}`)}"
                        />

                        <DsfrButton
                          label="Supprimer"
                          icon="fr-icon-delete-line"
                          size="sm"
                          :onClick="() => confirmDelete(notion.id)"
                          warning
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </BrandBackgroundContainer>
  </DefaultLayout>

  <!-- Boîte de dialogue de confirmation -->
  <DsfrModal
    :opened="showConfirmDialog"
    title="Confirmer la suppression"
    @close="closeDialog"
  >
    <template #content>
      <p>Êtes-vous sûr de vouloir supprimer cette notion ? Cette action est irréversible.</p>
    </template>
    <template #footer>
      <div class="fr-btns-group fr-btns-group--right fr-btns-group--inline">
        <DsfrButton
          label="Annuler"
          secondary
          :onClick="closeDialog"
        />
        <DsfrButton
          label="Supprimer"
          warning
          :onClick="deleteNotion"
        />
      </div>
    </template>
  </DsfrModal>
</template>

<style scoped>
.fr-btns-group--inline {
  display: flex;
  gap: 0.5rem;
}

.notion-item {
  border: 1px solid var(--border-default-grey);
  border-radius: 4px;
  background-color: var(--background-contrast-grey);
  transition: background-color 0.2s ease;
}

.notion-item:hover {
  background-color: var(--background-contrast-grey-hover);
}

.notion-description {
  color: var(--text-mention-grey);
}

.notion-list {
  margin-top: 1.5rem;
}
</style>
