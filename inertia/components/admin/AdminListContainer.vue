<script setup lang="ts">
import { DsfrAlert, DsfrBadge, DsfrButton, DsfrCard, DsfrModal } from '@gouvminint/vue-dsfr'
import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'

interface ListItem {
  id: number
  updatedAt: string | Date
  title: string
  slug: string
  status: string
  description?: string
}

const props = withDefaults(defineProps<{
  title: string
  items: ListItem[]
  entityName: string
  entityGender: 'm' | 'f'
  entityNamePlural: string
  createPath: string
  editPathPrefix: string
  viewPathPrefix: string
  deletePathPrefix: string
  emptyMessage?: string
}>(), {
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

function formatDate(date: string | Date): string {
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
      onFinish: () => closeDialog(),
    })
  }
}
</script>

<template>
  <AdminPageHeading :title="`Administration des ${entityNamePlural}`" />
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-footer">
      <div class="fr-grid-row fr-grid-row--right fr-mb-2w">
        <DsfrButton
          :label="`Créer ${articleIndefini} ${entityName}`"
          icon="fr-icon-add-line"
          @click="() => router.visit(createPath)"
        />
      </div>
      <h2>Liste des {{ entityNamePlural }}</h2>
      <DsfrAlert
        v-if="items.length === 0"
        :title="emptyMessage"
      />
      <div
        v-else
        class="fr-grid-row fr-grid-row--gutters"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="fr-col-12 fr-col-md-6"
        >
          <DsfrCard
            :title="item.title"
            :description="item.description || 'Aucune description'"
            :detail="`Modifié${entityName.endsWith('e') ? 'e' : ''} le ${formatDate(item.updatedAt)}`"
            no-arrow
            :buttons="[
              {
                label: 'Éditer',
                icon: { name: 'ri:edit-line', ssr: true },
                onClick: () => router.visit(`${props.editPathPrefix}/${item.id}`),
              },
              {
                label: 'Consulter',
                icon: { name: 'ri:eye-line', ssr: true },
                onClick: () => router.visit(`${props.viewPathPrefix}/${item.slug}`),
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
