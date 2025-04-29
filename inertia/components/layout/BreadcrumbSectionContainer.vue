<script setup lang="ts">
import { DsfrBreadcrumb } from '@gouvminint/vue-dsfr'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const props = withDefaults(defineProps<{
  contrast?: boolean
}>(), {
  contrast: false,
})

const { breadcrumbs } = storeToRefs(useBreadcrumbStore())

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
          v-if="breadcrumbs.length"
          class="fr-m-0"
          :style="styles"
          breadcrumb-id="fil-ariane"
          :links="breadcrumbs"
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
