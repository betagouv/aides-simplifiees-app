<script setup lang="ts" generic="T extends 'slug' | 'id' = 'slug'">
import { DsfrAlert, DsfrBadge, DsfrButtonGroup, DsfrCard, DsfrDataTable, DsfrModal } from '@gouvminint/vue-dsfr'
import { router, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'

// Base item interface with common properties
interface BaseItem {
  id: number
  title: string
  status: string
  updatedAt?: string | Date | null
  description?: string | null
}

// Type that enforces slug presence when T is 'slug'
type ListItem<U extends 'slug' | 'id'> = U extends 'slug'
  ? BaseItem & { slug: string } // Required slug when U is 'slug'
  : BaseItem & { slug?: string } // Optional slug when U is 'id'

const props = withDefaults(defineProps<{
  urlSegmentId?: T
  title: string
  layout?: 'cards' | 'table'
  items: ListItem<T>[]
  inertiaPropsName: string
  entityName: string
  entityGender: 'm' | 'f'
  entityNamePlural: string
  createPath: string
  editPathPrefix: string
  viewPathPrefix: string
  deletePathPrefix: string
  emptyMessage?: string
}>(), {
  urlSegmentId: 'slug' as any,
  layout: 'cards',
  emptyMessage: 'Aucun élément n\'a encore été créé',
})

const startWithVowel = (str: string) => /^[aeiouy]/i.test(str)

const articleDemonstratif = startWithVowel(props.entityName) ? `cet` : `ce`

const articleIndefini = props.entityGender === 'm' ? 'un' : 'une'

const confirmMessage = computed(() => {
  return `Êtes-vous sûr de vouloir supprimer ${articleDemonstratif} ${props.entityName} ? Cette action est irréversible.`
})

function formatStatus(status: string): string {
  const statusMap: Record<string, { label: string }> = {
    draft: { label: 'Brouillon' },
    published: { label: `Publié${props.entityGender === 'f' ? 'e' : ''}` },
    unlisted: { label: 'Non répertorié' },
    // archived: { label: 'Archivé', type: 'info' },
  }
  return statusMap[status]?.label || status
}

function formatDate(date: string | Date | null | undefined): string | null {
  if (!date) {
    return null
  }
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const itemToDelete = ref<number | null>(null)
const isModalOpen = ref(false)

function askConfirmDelete(id: number) {
  itemToDelete.value = id
  isModalOpen.value = true
}

function closeDialog() {
  itemToDelete.value = null
  isModalOpen.value = false
}

function deleteItem() {
  if (itemToDelete.value) {
    router.delete(`${props.deletePathPrefix}/${itemToDelete.value}`, {
      preserveScroll: true,
      onFinish: () => {
        closeDialog()
        // refresh the page to reflect the deletion
        router.visit(usePage().url, {
          only: [props.inertiaPropsName],
        })
      },
    })
  }
}

/**
 * Returns the segment ID for the item based on the configured URL segment ID (slug or id).
 */
function getItemSegmentId(item: ListItem<T>): string {
  if (props.urlSegmentId === 'slug') {
    // When using 'slug' mode, slug is guaranteed to be non-undefined thanks to our type
    return item.slug as string
  }
  return String(item.id)
}
</script>

<template>
  <AdminPageHeading :title="`Administration des ${entityNamePlural}`" />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--right fr-mb-4w">
        <div
          class="fr-col-12"
          :style="{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }"
        >
          <slot name="custom-actions" />
          <DsfrButtonGroup
            class="fr-ml-2v"
            :buttons="[
              {
                label: `Créer ${articleIndefini} ${entityName}`,
                icon: { name: 'ri:add-line', ssr: true },
                onClick: () => router.visit(props.createPath),
              },
            ]"
          />
        </div>
      </div>
      <DsfrAlert
        v-if="items.length === 0"
        :title="emptyMessage"
      />
      <div
        v-else
        class="fr-grid-row fr-grid-row--gutters"
      >
        <template v-if="layout === 'cards'">
          <h2 class="fr-col-12">
            Liste des {{ entityNamePlural }}
          </h2>
          <div
            v-for="item in items"
            :key="item.id"
            class="fr-col-12 fr-col-md-6"
          >
            <DsfrCard
              :title="item.title"
              :title-link-attrs="{}"
              :description="item.description || 'Aucune description'"
              :detail="(() => {
                const formatted = formatDate(item.updatedAt)
                if (!formatted) {
                  return undefined
                }
                return `Modifié${entityName.endsWith('e') ? 'e' : ''} le ${formatted}`
              })()"
              no-arrow
              :buttons="[
                {
                  label: 'Éditer',
                  icon: { name: 'ri:edit-line', ssr: true },
                  onClick: () => router.visit(`${props.editPathPrefix}/${item.id}/edit`),
                },
                {
                  label: 'Consulter',
                  icon: { name: 'ri:eye-line', ssr: true },
                  onClick: () => router.visit(`${props.viewPathPrefix}/${getItemSegmentId(item)}`),
                  secondary: true,
                },
                {
                  label: 'Supprimer',
                  icon: { name: 'ri:delete-bin-2-line', ssr: true },
                  secondary: true,
                  onClick: () => askConfirmDelete(item.id),
                },
              ]"
            >
              <template
                #start-details
              >
                <DsfrBadge
                  class="fr-mb-1w"
                  :label="formatStatus(item.status)"
                  small
                />
              </template>
            </DsfrCard>
          </div>
        </template>
        <template v-else-if="layout === 'table'">
          <div class="fr-col-12">
            <DsfrDataTable
              :title="`Liste des ${entityNamePlural}`"
              :headers-row="[
                { key: 'title', label: 'Titre' },
                // Conditionally include slug column if urlSegmentId is 'slug'
                ...(props.urlSegmentId === 'slug' ? [{ key: 'slug', label: 'Slug' }] : []),
                { key: 'status', label: 'Statut' },
                { key: 'updatedAt', label: 'Dernière modification' },
                { key: 'actions', label: 'Actions' },
              ]"
              :rows="items.map((item: ListItem<T>) => ({
                title: item.title,
                slug: item.slug ?? undefined,
                status: formatStatus(item.status),
                updatedAt: formatDate(item.updatedAt) || '',
                actions: item.id,
                id: item.id,
              }))"
              row-key="id"
            >
              <template #cell="{ colKey, cell }">
                <template v-if="colKey === 'actions'">
                  <div class="actions-wrapper">
                    <!-- <DsfrButton
                      label="Éditer"
                      secondary
                      size="sm"
                      icon="ri:edit-line"
                      @click="router.visit(`${editPathPrefix}/${cell}/edit`)"
                    />
                    <DsfrButton
                      label="Consulter"
                      secondary
                      size="sm"
                      icon="ri:eye-line"
                      @click="() => {
                        const item = items.find(i => i.id === Number(cell))
                        if (item) {
                          router.visit(`${viewPathPrefix}/${item.slug}`)
                        }
                      }"
                    />
                    <DsfrButton
                      label="Supprimer"
                      secondary
                      size="sm"
                      icon="ri:delete-bin-2-line"
                      @click="askConfirmDelete(Number(cell))"
                    /> -->
                    <DsfrButtonGroup
                      inline-layout-when="always"
                      equisized
                      size="sm"
                      class="fr-mb-0w"
                      :buttons="[
                        {
                          label: 'Éditer',
                          icon: { name: 'ri:edit-line', ssr: true },
                          onClick: () => router.visit(`${props.editPathPrefix}/${cell}/edit`),
                        },
                        {
                          label: 'Consulter',
                          icon: { name: 'ri:eye-line', ssr: true },
                          onClick: () => {
                            const item = items.find((i: ListItem<T>) => i.id === Number(cell))
                            if (item) {
                              router.visit(`${props.viewPathPrefix}/${getItemSegmentId(item)}`)
                            }
                          },
                          secondary: true,
                        },
                        {
                          label: 'Supprimer',
                          icon: { name: 'ri:delete-bin-2-line', ssr: true },
                          secondary: true,
                          onClick: () => askConfirmDelete(Number(cell)),
                        },
                      ]"
                    />
                  </div>
                </template>
                <template v-else>
                  {{ cell }}
                </template>
              </template>
            </DsfrDataTable>
          </div>
        </template>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>

  <!-- Boîte de dialogue de confirmation de suppression -->
  <DsfrModal
    :opened="isModalOpen"
    title="Confirmer la suppression"
    icon="ri:error-warning-line"
    :actions="[
      {
        label: 'Annuler',
        secondary: true,
        icon: { name: 'ri:close-line', ssr: true },
        onClick: closeDialog,
      },
      {
        label: 'Supprimer',
        icon: { name: 'ri:delete-bin-2-line', ssr: true },
        onClick: deleteItem,
      },
    ]"
    @close="closeDialog"
  >
    <p class="fr-text--lg">
      {{ confirmMessage }}
    </p>
  </DsfrModal>
</template>
