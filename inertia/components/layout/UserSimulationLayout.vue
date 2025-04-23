<script lang="ts" setup>
import { usePage } from '@inertiajs/vue3'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import DsfrPictogram from '~/components/DsfrPictogram.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import FormDebugPanel from '~/components/survey/FormDebugPanel.vue'
import { useSurveyDebugStore } from '~/stores/survey_debug'

const page = usePage<{
  simulateur: {
    pictogramPath: string
    title: string
    slug: string
  }
}>()
const simulateur = computed(() => page.props.simulateur)

// instantiate debug mode
const { debugMode } = storeToRefs(useSurveyDebugStore())
</script>

<template>
  <BrandBackgroundContainer>
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-header">
      <div class="fr-grid-row fr-grid-row--gutters">
        <div class="pictogram-container fr-col-3 fr-col-sm-2 fr-col-lg-1">
          <DsfrPictogram
            v-if="simulateur?.pictogramPath"
            :svg-path="simulateur.pictogramPath"
          />
        </div>
        <div
          id="simulateur-title"
          class="simulation-title-container fr-col-9 fr-col-sm-10 fr-col-lg-11"
        >
          <h1
            v-if="simulateur?.title"
            class="fr-h5 fr-m-0"
          >
            {{ simulateur.title }}
          </h1>
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
  <BrandBackgroundContainer
    textured
    blue
    subtle
  >
    <SectionContainer
      type="page-footer"
      class="simulateur-container"
    >
      <div class="fr-grid-row fr-grid-row--gutters">
        <div class="fr-col-12 fr-col-md-6">
          <FormDebugPanel
            v-if="debugMode"
            :simulateur-id="simulateur.slug"
          />
        </div>
        <div
          :class="[
            {
              'fr-col-12 fr-col-offset-md-1 fr-col-md-10 fr-col-offset-lg-2 fr-col-lg-8':
                !debugMode,
            },
            { 'fr-col-12 fr-col-md-6': debugMode },
          ]"
        >
          <slot />
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped lang="scss">
.simulation-title-container {
  display: flex;
  align-items: center;
  min-height: 6rem;
}

.simulateur-container {
  min-height: 80vh;
}

.pictogram-container:deep(svg) {
  width: 100%;
}
</style>
