<script lang="ts" setup>
import type { DateTime } from 'luxon'
import { formatDateTime } from '~/utils/date_time'

const props = defineProps<{
  title: string
  updatedAt: string | null | DateTime
  html: string
}>()

const formatted = formatDateTime(props.updatedAt)
</script>

<template>
  <article class="brand-html-content">
    <header class="fr-mb-4w">
      <hgroup>
        <h1>{{ title }}</h1>
        <p
          v-if="formatted"
          class="fr-hint-text fr-text--md"
        >
          Dernière mise à jour le {{ formatted.date }} à {{ formatted.time }}
        </p>
      </hgroup>
    </header>
    <div v-html="html" />
  </article>
</template>
