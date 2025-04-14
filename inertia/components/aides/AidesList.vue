<script lang="ts" setup>
import type { DsfrCardProps } from '@gouvminint/vue-dsfr'

type AidesListProps = {
  aides: RichAide[]
  itemsPerPage?: number
} & Pick<DsfrCardProps, 'horizontal' | 'size' | 'titleTag'>

const props = withDefaults(defineProps<AidesListProps>(), {
  itemsPerPage: 6
})
const currentPageIndex = ref<number>(0)

const totalPages = computed(() => Math.ceil(props.aides.length / props.itemsPerPage))

interface Page {
  label: string
  title: string
  href: string
}
const pages = computed<Page[]>(() =>
  Array.from({ length: totalPages.value }, (_, i) => ({
    label: String(i + 1),
    title: `Page ${i + 1}`,
    href: `#page-${i + 1}`
  }))
)

const currentPageAides = computed(() => {
  const start = currentPageIndex.value * props.itemsPerPage
  const end = start + props.itemsPerPage
  return props.aides.slice(start, end)
})
</script>

<template>
  <div class="fr-grid-row fr-grid-row--gutters">
    <div
      v-for="aide in currentPageAides"
      :key="aide.id"
      class="fr-col-12 fr-col-md-6"
    >
      <AideCard
        :link="aide.link"
        :titre="aide.titre"
        :description="aide.description"
        :instructeur="aide.instructeur"
        :type-aide="aide.type"
        :montant="aide.montant"
        v-bind="{
          horizontal,
          size,
          titleTag,
        }"
      />
    </div>
  </div>

  <div
    v-if="totalPages > 1"
    class="fr-mt-4w fr-grid-row fr-grid-row--center"
  >
    <DsfrPagination
      v-model:current-page="currentPageIndex"
      :pages="pages"
    />
  </div>
</template>
