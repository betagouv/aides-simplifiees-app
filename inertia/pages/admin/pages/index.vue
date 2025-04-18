<script setup lang="ts">
import { Head, router, Link } from '@inertiajs/vue3'
import DefaultLayout from '../../../layouts/default.vue'
import BrandBackgroundContainer from '../../../components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '../../../components/layout/SectionContainer.vue'

defineProps<{
  pages: {
    id: number
    title: string
    slug: string
    createdAt: string
    updatedAt: string
  }[]
}>()
</script>

<template>
  <Head title="Pages | Administration" />

  <DefaultLayout>
    <BrandBackgroundContainer textured contrast>
      <SectionContainer type="page-header">
        <h1 class="brand-contrast-text"><br />Administration des pages</h1>
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
                  { text: 'Pages', to: '/admin/pages' },
                ]"
              />
            </div>
          </div>

          <div>
            <div class="fr-grid-row fr-grid-row--right fr-mb-2w">
              <DsfrButton
                label="Créer une page"
                icon="fr-icon-add-line"
                :onclick="
                  () => {
                    router.visit(`/admin/pages/create`)
                  }
                "
              />
            </div>

            <h2 class="fr-mb-3w">Liste des pages</h2>

            <div v-if="pages.length === 0" class="fr-alert fr-alert--info">
              <p>Aucune page trouvée</p>
            </div>

            <div v-else class="page-list">
              <div
                v-for="page in pages"
                :key="page.id"
                class="fr-grid-row fr-grid-row--gutters fr-mb-2w page-item"
              >
                <div class="fr-col-12 fr-p-2w">
                  <div class="fr-grid-row fr-grid-row--middle">
                    <div class="fr-col-12 fr-col-md-8">
                      <h3 class="fr-mb-0">{{ page.title }}</h3>
                      <p class="fr-mb-0">
                        <span class="fr-badge fr-badge--sm fr-badge--blue-cumulus fr-mr-1w"
                          >#{{ page.id }}</span
                        >
                        <span class="fr-text--sm fr-mr-1w">Slug: {{ page.slug }}</span>
                        <span class="fr-text--sm fr-text--italic"
                          >Mise à jour: {{ new Date(page.updatedAt).toLocaleDateString() }}</span
                        >
                      </p>
                    </div>

                    <div
                      class="fr-col-12 fr-col-md-4 fr-grid-row fr-grid-row--right fr-mt-2w fr-mt-md-0"
                    >
                      <div class="fr-btns-group fr-btns-group--inline">
                        <DsfrButton
                          label="Éditer"
                          icon="fr-icon-edit-line"
                          size="sm"
                          :onclick="
                            () => {
                              router.visit(`/admin/pages/${page.id}/edit`)
                            }
                          "
                        />
                        <DsfrButton
                          label="Voir"
                          icon="fr-icon-eye-line"
                          size="sm"
                          secondary
                          :onclick="
                            () => {
                              router.visit(`/content/${page.slug}`)
                            }
                          "
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
</template>

<style scoped>
.fr-btns-group--inline {
  display: flex;
  gap: 0.5rem;
}

.page-item {
  border: 1px solid var(--border-default-grey);
  border-radius: 4px;
  background-color: var(--background-contrast-grey);
  transition: background-color 0.2s ease;
}

.page-item:hover {
  background-color: var(--background-contrast-grey-hover);
}

.page-list {
  margin-top: 1.5rem;
}
</style>
