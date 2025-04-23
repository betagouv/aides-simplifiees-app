<script lang="ts" setup>
import { computed } from 'vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'

defineProps<{
  progress: number
}>()
// Heading levels based on iframe context
const { isIframe } = useIframeDisplay()
const surveyH2 = computed(() => isIframe.value ? 'h2' : 'h3')
</script>

<template>
  <div class="fr-card fr-p-4w">
    <component
      :is="surveyH2"
      class="fr-h4"
    >
      Vous avez déjà commencé une simulation
    </component>
    <DsfrBadge
      class="fr-mt-n1w fr-mb-2w"
      type="info"
      :label="`Progression : ${progress}%`"
    />
    <p class="fr-text--lg fr-mb-0">
      Souhaitez-vous reprendre votre simulation ou la recommencer ?
    </p>
  </div>
</template>
