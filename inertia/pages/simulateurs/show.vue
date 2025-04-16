<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { usePage, useForm } from '@inertiajs/vue3'
import { useIframeDisplay } from '~/composables/useIframeDisplay'
import DefaultLayout from '../../layouts/default.vue'
import Survey from '../../components/form/Survey.vue'

// Récupérer les données du simulateur depuis les props
const props = defineProps<{
  simulateur: {
    id: number,
    slug: string,
    title: string,
    description: string,
    shortTitle: string,
    pictogramPath: string,
    status: 'published' | 'draft',
    builtJson: string
  },
  simulateurJson: Record<string, any>
}>()

// État local pour le paramètre resume
const shouldResume = ref(false)

// Récupérer la route courante
const page = usePage()
const route = computed(() => page.props.route)
const currentParams = computed(() => new URLSearchParams(window.location.search))

// Vérification si on vient d'une page qui justifie une reprise automatique
onMounted(() => {
  // Pour simuler l'effet du middleware de Nuxt pour la reprise auto
  const fromPathname = document.referrer

  const shouldForceResume = [
    '/recapitulatif',
    '/notion',
    '/resultats'
  ].some(path => fromPathname.includes(path))

  if (shouldForceResume && !currentParams.value.has('resume')) {
    // Ajouter resume=true et rafraîchir la page
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('resume', 'true')
    window.history.pushState({}, '', newUrl)
    shouldResume.value = true
  } else if (currentParams.value.get('resume') === 'true' && !shouldForceResume) {
    // Supprimer le paramètre resume si on ne vient pas des pages concernées
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('resume')
    window.history.pushState({}, '', newUrl)
    shouldResume.value = false
  } else if (currentParams.value.get('resume') === 'true') {
    shouldResume.value = true
  }

  // Définir les breadcrumbs
  const { setBreadcrumbs } = useBreadcrumbStore()
  setBreadcrumbs([
    { text: 'Accueil', to: '/' },
    { text: 'Simulateurs', to: '/simulateurs' },
    { text: props.simulateur.title, to: `/simulateurs/${props.simulateur.slug}#simulateur-title` }
  ])

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
    :description="simulateur.description || `En quelques clics sur le simulateur '${simulateur.title}', découvrez si vous pouvez bénéficier d'aides financières.`"
  />
  <DefaultLayout>
    <div id="simulateur-title"></div>
    <template v-if="simulateur">
      <Survey v-if="true" :simulateur-id="simulateur.slug" />
    </template>
  </DefaultLayout>
</template>
