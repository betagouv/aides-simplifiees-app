<script lang="ts" setup>
definePageMeta({
  layout: 'user-simulation',
  validate: getContentRouteValidator(['aide_id', 'simulateur_id']),
  middleware: [
    'check-iframe-layout',
    'load-simulateur',
    'load-aide'
  ],
})

const route = useRoute()
const nuxtApp = useNuxtApp()
const simulateurId = route.params.simulateur_id as string
const simulateur = nuxtApp.payload.data[`simulateur-${simulateurId}`]
const simulateurTitle = simulateur?.titre || simulateurId

const aideId = route.params.aide_id
const aide = nuxtApp.payload.data[`aide-${aideId}`]
const aideTitle = aide?.titre || aideId

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle, to: `/simulateurs/${simulateurId}#simulateur-title` },
  { text: 'Résultats', to: `/simulateurs/${simulateurId}/resultats#simulateur-title` },
  { text: aideTitle, to: `/simulateurs/${simulateurId}/resultats/${aideId}#simulateur-title` }
])

useSeoMeta({
  title: `Aide "${aideTitle}" | Aides simplifiées`,
  description: aide.description || `Découvrez toutes les informations sur l'aide "${aideTitle}" pour vous accompagner dans vos démarches.`
})
</script>

<template>
  <article v-if="simulateur && aide">
    <header class="fr-mb-6w">
      <h1>
        {{ aideTitle }}
      </h1>
      <DsfrLink
        icon-before
        label="Revenir à mes résultats"
        :to="`/simulateurs/${simulateurId}/resultats/#simulateur-title`"
        :icon="{ name: 'ri:arrow-left-line', ssr: true }"
      />
    </header>
    <div class="fr-card fr-p-3w">
      <ContentRenderer :value="aide" />
    </div>
  </article>
</template>
