<script lang="ts" setup>
definePageMeta({
  layout: 'user-simulation',
  middleware: [
    'check-iframe-layout',
    'load-simulateur',
    function (to, from) {
      const resume = to.query.resume
      const fromName = from.matched[0].name as string

      const shouldForceResume = [
        'simulateurs-simulateur_id-recapitulatif',
        'simulateurs-simulateur_id-notion_id',
        'simulateurs-simulateur_id-resultats'
      ].includes(fromName)

      /**
       * Important :
       * If user is coming from certain pages (notion_id, resultats)
       * we do not want to render the modal which propose to resume the simulation.
       * We want to force the resume by adding the query param resume=true.
       */
      if (!resume && shouldForceResume) {
        // Create a new query object with all existing params
        const query = { ...to.query, resume: 'true' }
        return navigateTo({ path: to.path, query, hash: to.hash })
      }
      /**
       * If the query param resume=true is present,
       * and we are not coming from certain pages,
       * we want to remove the query param resume
       */
      if (resume && !shouldForceResume) {
        // Create a new query object without the resume param
        const query = { ...to.query }
        delete query.resume
        return navigateTo({ path: to.path, query, hash: to.hash })
      }
    }
  ],
  validate: getContentRouteValidator('simulateur_id')
})

const route = useRoute()
const nuxtApp = useNuxtApp()
const simulateurId = route.params.simulateur_id as string
const simulateur = nuxtApp.payload.data[`simulateur-${simulateurId}`]
const simulateurTitle = simulateur?.titre || simulateurId

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle, to: `/simulateurs/${simulateurId}#simulateur-title` }
])

useSeoMeta({
  title: `Simulateur "${simulateurTitle}" | Aides simplifiées`,
  description: simulateur?.description || `En quelques clics sur le simulateur "${simulateurTitle}", découvrez si vous pouvez bénéficier d'aides financières.`
})

// Load iframe-resizer script when in iframe mode
const { isIframe } = useIframeDisplay()
onMounted(() => {
  if (isIframe.value) {
    const script = document.createElement('script')
    script.src = '/scripts/iframeResizer.contentWindow.min.js'
    script.async = true
    document.head.appendChild(script)
  }
})
</script>

<template>
  <template v-if="simulateur">
    <Survey :simulateur-id="simulateurId" />
  </template>
</template>
