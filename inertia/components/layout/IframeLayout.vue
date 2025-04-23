<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CrispButton from '~/components/CrispButton.vue'
import { useCrispStore } from '~/stores/crisp'

const crispStore = useCrispStore()
const { isChatOpen } = storeToRefs(crispStore)
</script>

<template>
  <main
    id="content"
    role="main"
    tabindex="-1"
    class="main-iframe"
    :class="{
      'main-iframe--has-chat': isChatOpen,
    }"
  >
    <slot />
    <CrispButton
      class="crisp-button"
    />
  </main>
</template>

<style>
#crisp-chatbox>div>div {
  top: 56px !important;
  right: 8px !important;
  bottom: auto !important;
}
</style>

<style scoped lang="scss">
.main-iframe {
  padding: 8px; // make sure focus outline is visible
  &.main-iframe--has-chat {
    height: 600px;
  }
}

.crisp-button {
  position: fixed;
  top: .5rem;
  right: .5rem;
  z-index: 9999;
}
</style>
