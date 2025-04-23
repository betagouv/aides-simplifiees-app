<script lang="ts" setup>
import { computed } from 'vue'
import DsfrLink from '~/components/DsfrLink.vue'
import MatomoOptOut from '~/components/MatomoOptOut.vue'
import { useIframeDisplay } from '~/composables/useIframeDisplay'

// Heading levels based on iframe context
const { isIframe } = useIframeDisplay()
const surveyH2 = computed(() => isIframe.value ? 'h2' : 'h3')
</script>

<template>
  <div>
    <div class="fr-card fr-p-4w">
      <component
        :is="surveyH2"
        class="fr-h4"
      >
        Un simulateur en cours d'amélioration
      </component>

      <!-- Content for both iframe and regular site -->
      <p>
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
