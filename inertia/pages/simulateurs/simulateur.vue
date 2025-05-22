<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import { onMounted } from 'vue'
import Survey from '~/components/survey/Survey.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    simulateur,
  },
} = usePage<InferPageProps<SimulateurController, 'show'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateur.title, to: `/simulateurs/${simulateur.slug}#simulateur-title` },
])

// Load iframe-resizer package when in iframe mode
const { isIframe } = useIframeDisplay()
onMounted(() => {
  if (isIframe.value) {
    import('@iframe-resizer/child')
      .catch((error) => {
        console.error('Failed to load iframe-resizer child package:', error)
      })
  }
})
</script>

<template>
  <Head
    :title="`Simulateur '${simulateur.title}'`"
    :description="simulateur.metaDescription || simulateur.description"
  />
  <Survey />
</template>
