<script lang="ts" setup>
import DsfrLink from '~/components/DsfrLink.vue'
import MatomoOptOut from '~/components/MatomoOptOut.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'

const props = defineProps<{
  simulateur: string
}>()

const { isIframe } = useIframeDisplay()
</script>

<template>
  <div>
    <div class="fr-card fr-p-4w">
      <h2
        class="fr-h4"
      >
        Un simulateur en cours d'amélioration
      </h2>

      <!-- Content for both iframe and regular site -->
      <p v-if="simulateur?.slug === 'entreprise-innovation'">
        <span class="fr-text--bold">Bienvenue !</span>
        Ce simulateur vous permet d'estimer 6 aides financières pour <strong>favoriser l'innovation de votre entreprise</strong>.
        <br/>Ce service est en construction : vos retours sont les bienvenus pour l'améliorer.
      </p>
      <p v-else>
        <span class="fr-text--bold">Bienvenue !</span>
        Ce simulateur vous permet d'estimer 5 aides financières pour le logement et le déménagement, conçu en priorité pour <strong>les lycéens et étudiants qui s'installent seuls.</strong>
        Ce service est en construction : vos retours sont les bienvenus pour l'améliorer.
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
