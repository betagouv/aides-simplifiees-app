<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, onMounted, watch } from 'vue';
import { useBreadcrumbStore } from '~/stores/breadcrumbs';
import SectionContainer from './SectionContainer.vue';
import { DsfrBreadcrumb } from '@gouvminint/vue-dsfr';

const props = withDefaults(defineProps<{
  contrast?: boolean
}>(), {
  contrast: false
})

// Create a ref to hold breadcrumbs
const breadcrumbsData = ref([])

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined'

// Create a ref to store
const breadcrumbStore = ref<ReturnType<typeof useBreadcrumbStore> | null>(null)

// Only use the store in browser environment or inside onMounted
onMounted(() => {
  if (isBrowser) {
    breadcrumbStore.value = useBreadcrumbStore()
    const { breadcrumbs } = storeToRefs(breadcrumbStore.value)
    breadcrumbsData.value = breadcrumbs.value

    // Watch for changes to the breadcrumbs in the store
    watch(() => breadcrumbs.value, (newBreadcrumbs) => {
      breadcrumbsData.value = newBreadcrumbs
    })
  }
})

const styles = computed(() => {
  if (!props.contrast) {
    return {}
  }
  return {
    '--text-default-grey': 'var(--brand-contrast-text--disabled)',
    '--text-mention-grey': 'var(--brand-contrast-text)',
  }
})
</script>

<template>
  <SectionContainer type="page-breadcrumb">
    <div class="fr-grid-row fr-grid-row--gutters">
      <div
        class="fr-col-12 breadcrumb-container"
      >
        <DsfrBreadcrumb
          v-if="breadcrumbsData.length"
          class="fr-m-0"
          :style="styles"
          breadcrumb-id="fil-ariane"
          :links="breadcrumbsData"
        />
      </div>
    </div>
  </SectionContainer>
</template>

<style scoped lang="scss">
.breadcrumb-container {
  min-height: 2.25rem;
  @media screen and (min-width: 48em) {
    min-height: 3.25rem;
  }
}
</style>
