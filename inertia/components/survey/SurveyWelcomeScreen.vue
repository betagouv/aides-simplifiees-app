<script lang="ts" setup>
import type { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import DsfrLink from '~/components/DsfrLink.vue'
import MatomoOptOut from '~/components/MatomoOptOut.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'

const props = defineProps<{
  simulateur: {
    slug: string
  }
}>()

const { isIframe } = useIframeDisplay()
const page = usePage<SharedProps>()
const isPreprod = page.props.isPreprod
const introPhrase = computed(() => {
  switch (props.simulateur.slug) {
    case 'entreprise-innovation':
      return 'Ce simulateur vous permet d\'estimer 6 aides financières pour favoriser l\'innovation de votre entreprise.'
    case 'demenagement-logement':
      return 'Ce simulateur vous permet d\'estimer 5 aides financières pour le logement et le déménagement, conçu en priorité pour les lycéens et étudiants qui déménagent seuls au sein du territoire français.'
    default:
      return ''
  }
})
</script>

<template>
  <div>
    <div class="fr-card fr-p-4w">
      <h2
        class="fr-h4"
        data-testid="survey-welcome-title"
      >
        Un simulateur en cours d'amélioration <span
          v-if="isPreprod"
          class="fr-text--bold"
          style="color: red;"
        > ⚠️ (environnement de préproduction)</span>
      </h2>
      <p>
        <span class="fr-text--bold">Bienvenue !</span>
        <br>
        {{ introPhrase }}
      </p>
      <p>
        Ce service est en construction : vos retours sont les bienvenus pour l'améliorer. <br>
        Pour ce faire, n'hésitez pas à cliquer sur la <b>bulle d'aide bleue {{ isIframe ? "en haut à droite de cette boîte" : "en bas à droite de l'écran" }}</b> pour nous faire part de vos retours.
      </p>
      <p>
        Les questions marquées d'une étoile rouge (<span style="color: var(--artwork-minor-red-marianne); font-weight: bold;">*</span>) sont obligatoires pour continuer la simulation.
      </p>
      <p>
        En accédant au service, vous acceptez les
        <DsfrLink
          :icon="{ name: 'ri:external-link-line', ssr: true }"
          to="/content/cgu"
          label="Conditions Générales d'Utilisation"
          target="_blank"
        />. {{ isIframe ? "Ce site utilise certaines informations de navigation (appelées cookies) pour mieux comprendre l'usage du service et en améliorer l'expérience. Vous pouvez choisir d'être exclu(e) du suivi." : "" }}
      </p>
      <template v-if="isIframe">
        <MatomoOptOut :show-intro="false" />
      </template>
    </div>
  </div>
</template>
