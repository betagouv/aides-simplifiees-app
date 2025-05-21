<script lang="ts" setup>
import { formatDateTime } from '~/utils/date_time'

const props = defineProps<{
  title: string
  updatedAt?: string
  html: string
}>()
console.log('props', props)
const formatted = props.updatedAt ? formatDateTime(props.updatedAt) : null
</script>

<template>
  <article class="brand-html-content">
    <header class="fr-mb-4w">
      <hgroup>
        <h1>{{ title }}</h1>
        <p
          v-if="formatted?.date && formatted?.time"
          class="fr-hint-text fr-text--md"
        >
          Dernière mise à jour le {{ formatted.date }} à {{ formatted.time }}
        </p>
      </hgroup>
    </header>
    <div v-html="html" />
  </article>
</template>
