<script lang="ts" setup>
definePageMeta({
  layout: 'user-simulation',
  middleware: [
    'check-iframe-layout',
    'load-simulateur',
    'load-notion'
  ],
  validate: getContentRouteValidator(['notion_id', 'simulateur_id'])
})

const route = useRoute()
const nuxtApp = useNuxtApp()
const simulateurId = route.params.simulateur_id as string
const simulateur = nuxtApp.payload.data[`simulateur-${simulateurId}`]
const simulateurTitle = simulateur?.titre || simulateurId
const notionId = route.params.notion_id
const notion = nuxtApp.payload.data[`notion-${notionId}`]
const notionTitle = notion?.titre || notionId

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle, to: `/simulateurs/${simulateurId}#simulateur-title` },
  { text: notionTitle, to: `/simulateurs/${simulateurId}/${notionId}#simulateur-title` }
])

useSeoMeta({
  title: `Informations sur la notion "${notionTitle}" | Aides simplifiées`,
  description: notion.description || `Découvrez toutes les informations sur la notion "${notionTitle}" pour vous accompagner dans vos démarches.`
})
</script>

<template>
  <article v-if="simulateur && notion">
    <header class="fr-mb-6w">
      <h1>
        {{ notionTitle }}
      </h1>
      <DsfrLink
        icon-before
        label="Revenir à ma simulation"
        :to="`/simulateurs/${simulateurId}#simulateur-title`"
        :icon="{ name: 'ri:arrow-left-line', ssr: true }"
      />
    </header>
    <div class="fr-card fr-p-3w">
      <ContentRenderer :value="notion" />
    </div>
  </article>
</template>

<style scoped lang="scss"></style>
