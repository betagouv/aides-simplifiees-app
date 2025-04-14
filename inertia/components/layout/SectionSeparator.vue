<script lang="ts" setup>
withDefaults(defineProps<{
  fluid?: boolean
}>(), {
  fluid: false
})
</script>

<template>
  <div
    :class="[
      { 'fr-container': !fluid },
      { 'fr-container--fluid': fluid },
    ]"
  >
    <hr class="section-separator">
  </div>
</template>

<style scoped lang="scss">
.section-separator {
  border-top: 1px solid var(--border-open-blue-france);
  margin-top: 0;
  margin-bottom: 0;
  padding: 0;
}
</style>
