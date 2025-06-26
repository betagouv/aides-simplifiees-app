<script lang="ts" setup>
import type { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/vue3'
import DsfrLink from '~/components/DsfrLink.vue'
import MatomoOptOut from '~/components/MatomoOptOut.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'

defineProps<{
  simulateur: {
    slug: string
  }
}>()

const { isIframe } = useIframeDisplay()
const page = usePage<SharedProps>()
const isPreprod = page.props.isPreprod
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

      <!-- Content for both iframe and regular site -->
      <p v-if="simulateur?.slug === 'entreprise-innovation'">
        <span class="fr-text--bold">Bienvenue !</span>
        Ce simulateur vous permet d'estimer 6 aides financières pour <strong>favoriser l'innovation de votre entreprise</strong>.
        <br>Ce service est en construction : vos retours sont les bienvenus pour l'améliorer. <br>
        Pour ce faire, n'hésitez pas à cliquer sur la <b><u>bulle d'aide bleu à droite de l'écran</u></b> pour nous faire part de vos retours.
      </p>
      <p v-else>
        <span class="fr-text--bold">Bienvenue !</span>
        Ce simulateur vous permet d'estimer 5 aides financières pour le logement et le déménagement, conçu en priorité pour <strong>les lycéens et étudiants qui déménagent seuls au sein du territoire français.</strong>
        Ce service est en construction : vos retours sont les bienvenus pour l'améliorer et prendre en compte plus de situations.
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
