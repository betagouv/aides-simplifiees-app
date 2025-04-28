<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'

defineProps<{
  counts: {
    pages: number
    notions: number
    aides: number
  }
}>()
</script>

<template>
  <Head title="Administration" />

  <BrandBackgroundContainer
    textured
    contrast
  >
    <SectionContainer type="page-header">
      <h1 class="brand-contrast-text">
        <br>Administration
      </h1>
    </SectionContainer>
  </BrandBackgroundContainer>

  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-block">
      <div class="fr-grid-row fr-grid-row--gutters">
        <div class="fr-col-12 fr-col-md-4">
          <DsfrCard
            title="Pages"
            description="Pages statiques du site (cgu, accessibilité, mentions légales, etc.)"
            link="/admin/pages"
            icon-class="fr-icon-file-line"
          />
        </div>

        <div class="fr-col-12 fr-col-md-4">
          <DsfrCard
            title="Notions"
            description="Adminstre les pages d'explication : notions, en lien avec les question du simulateur"
            link="/admin/notions"
            icon-class="fr-icon-bookmark-line"
          />
        </div>

        <div class="fr-col-12 fr-col-md-4">
          <DsfrCard
            title="Aides"
            description="Recense les aides disponibles"
            link="/admin/aides"
            icon-class="fr-icon-hand-coin-line"
          />
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
