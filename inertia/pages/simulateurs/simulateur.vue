<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import { onMounted } from 'vue'
import Survey from '~/components/survey/Survey.vue'
import { useIframeDisplay } from '~/composables/useIframeDisplay'
import UserSimulationLayout from '~/layouts/user-simulation.vue'
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

onMounted(() => {
  // Script iframe-resizer pour mode iframe
  const { isIframe } = useIframeDisplay()
  if (isIframe.value) {
    const script = document.createElement('script')
    script.src = '/scripts/iframeResizer.contentWindow.min.js'
    script.async = true
    document.head.appendChild(script)
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
  <UserSimulationLayout>
    <Survey :simulateur-id="simulateur.slug" />
  </UserSimulationLayout>
</template>
