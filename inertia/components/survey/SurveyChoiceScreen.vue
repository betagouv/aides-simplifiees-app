<script lang="ts" setup>
defineProps<{
  progress: number
}>()
</script>

<template>
  <div class="fr-card fr-p-4w">
    <h2 class="fr-h4">
      Vous avez déjà commencé une simulation
    </h2>
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
