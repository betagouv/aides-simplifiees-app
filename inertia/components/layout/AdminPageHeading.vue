<script setup lang="ts">
import type { DateTime } from 'luxon'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { formatDateTime } from '~/utils/date_time'

const props = defineProps<{
  updatedAt?: string | null | DateTime
} & (
  {
    title?: string
    highlightedTitle: string
  } | {
    title: string
    highlightedTitle?: string
  }
)>()

const formatted = formatDateTime(props.updatedAt)
</script>

<template>
  <BrandBackgroundContainer
    textured
    contrast
  >
    <BreadcrumbSectionContainer contrast />
    <SectionContainer type="page-header">
      <hgroup>
        <h1 class="brand-contrast-text">
          <span
            v-if="highlightedTitle"
            class="brand-contrast-text--highlight"
          >{{ highlightedTitle }}<br>
          </span>
          <span
            v-html="title"
          />
        </h1>
        <p
          v-if="formatted"
          class="fr-hint-text fr-text--md brand-contrast-text--hint-text"
        >
          Dernière mise à jour le {{ formatted.date }} à {{ formatted.time }}
        </p>
      </hgroup>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
