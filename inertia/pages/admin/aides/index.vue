<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'

defineProps<{
  aides: {
    id: number
    title: string
    slug: string
    type: string | null
    usage: string | null
    instructeur: string | null
    createdAt: string
    updatedAt: string
  }[]
}>()
</script>

<template>
  <Head title="Aides | Administration" />

  <BrandBackgroundContainer
    textured
    contrast
  >
    <SectionContainer type="page-header">
      <h1 class="brand-contrast-text">
        <br>Administration des aides
      </h1>
    </SectionContainer>
  </BrandBackgroundContainer>

  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-block">
      <div class="fr-container fr-container--fluid">
        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12">
            <DsfrBreadcrumb
              :links="[
                { text: 'Administration', to: '/admin' },
                { text: 'Aides', to: '/admin/aides' },
              ]"
            />
          </div>
        </div>

        <div>
          <div class="fr-grid-row fr-grid-row--right fr-mb-2w">
            <DsfrButton
              label="Créer une aide"
              icon="fr-icon-add-line"
              :onclick="
                () => {
                  router.visit(`/admin/aides/create`)
                }
              "
            />
          </div>

          <h2 class="fr-mb-3w">
            Liste des aides
          </h2>

          <div
            v-if="aides.length === 0"
            class="fr-alert fr-alert--info"
          >
            <p>Aucune aide trouvée</p>
          </div>

          <div
            v-else
            class="aide-list"
          >
            <div
              v-for="aide in aides"
              :key="aide.id"
              class="fr-grid-row fr-grid-row--gutters fr-mb-2w aide-item"
            >
              <div class="fr-col-12 fr-p-2w">
                <div class="fr-grid-row fr-grid-row--middle">
                  <div class="fr-col-12 fr-col-md-8">
                    <h3 class="fr-mb-0">
                      {{ aide.title }}
                    </h3>
                    <p class="fr-mb-0 badges-row">
                      <span class="fr-badge fr-badge--sm fr-badge--blue-cumulus fr-mr-1w">#{{ aide.id }}</span>
                      <span
                        v-if="aide.type"
                        class="fr-badge fr-badge--green-emeraude fr-mr-1w"
                      >{{
                        aide.type
                      }}</span>
                      <span
                        v-if="aide.instructeur"
                        class="fr-badge fr-badge--brown-cafe-creme fr-mr-1w"
                      >{{ aide.instructeur }}</span>
                    </p>
                    <p class="fr-mb-0">
                      <span class="fr-text--sm fr-mr-1w">Slug: {{ aide.slug }}</span>
                      <span class="fr-text--sm fr-text--italic">Mise à jour: {{ new Date(aide.updatedAt).toLocaleDateString() }}</span>
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
                            router.visit(`/admin/aides/${aide.id}/edit`)
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
                            router.visit(`/aides/${aide.slug}`)
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
</template>

<style scoped>
.fr-btns-group--inline {
  display: flex;
  gap: 0.5rem;
}

.aide-item {
  border: 1px solid var(--border-default-grey);
  border-radius: 4px;
  background-color: var(--background-contrast-grey);
  transition: background-color 0.2s ease;
}

.aide-item:hover {
  background-color: var(--background-contrast-grey-hover);
}

.aide-list {
  margin-top: 1.5rem;
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
