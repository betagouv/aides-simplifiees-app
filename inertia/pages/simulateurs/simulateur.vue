<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import { onMounted } from 'vue'
import Survey from '~/components/survey/Survey.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

// Récupérer les données du simulateur depuis les props
const props = defineProps<{
  simulateur: {
    id: number
    slug: string
    title: string
    description: string
    shortTitle: string
    pictogramPath: string
    status: 'published' | 'draft'
    builtJson: string
  }
  simulateurJson: Record<string, any>
}>()

// Définir les breadcrumbs
const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: props.simulateur.title, to: `/simulateurs/${props.simulateur.slug}#simulateur-title` },
])

// Load iframe-resizer package when in iframe mode
const { isIframe } = useIframeDisplay()
onMounted(() => {
  if (isIframe.value) {
    // Import the @iframe-resizer/child package dynamically only when needed
    import('@iframe-resizer/child')
      .catch((error) => {
        console.error('Failed to load iframe-resizer child package:', error)
      })
  }
})
</script>

<template>
  <Head
    :title="`Simulateur '${simulateur.title}' | Aides simplifiées`"
    :description="
      simulateur.description
        || `En quelques clics sur le simulateur '${simulateur.title}', découvrez si vous pouvez bénéficier d'aides financières.`
    "
  />
  <Survey :simulateur-id="simulateur.slug" />
</template>
