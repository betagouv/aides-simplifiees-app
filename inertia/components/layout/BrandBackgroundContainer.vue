<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useSchemeStore } from '../../stores/scheme'
import BrandBackgroundTexture from './BrandBackgroundTexture.vue'

const props = withDefaults(defineProps<{
  contrast?: boolean
  subtle?: boolean
  textured?: boolean
  blue?: boolean
}>(), {
  contrast: false,
  subtle: false,
  textured: false,
  blue: false,
})

// Default values for SSR
const defaultPreferences = {
  theme: 'light',
  scheme: 'light'
}

// Only use the store in browser environment
const isBrowser = typeof window !== 'undefined'
const schemeStore = isBrowser ? useSchemeStore() : null
const { preferences } = isBrowser ? storeToRefs(schemeStore!) : { preferences: ref(defaultPreferences) }

const mixBlendMode = computed(() => {
  return (
    preferences.value.theme === 'dark'
    || props.contrast
  )
    ? 'lighten'
    : 'darken'
})

const opacity = props.subtle ? 0.2 : 0.8

const backgroundColorClass = computed(() => {
  if (
    props.contrast
    && preferences.value.theme === 'light'
  ) {
    return 'fr-background-action-high--blue-france'
  }
  else if (props.blue) {
    return 'fr-background-alt--blue-france'
  }
  return `fr-background-default--grey`
})

const bgContainer = ref(null)
const { height: containerHeight } = isBrowser ? useElementSize(bgContainer) : { height: ref(0) }
</script>

<template>
  <div
    class="container-with-bg"
    :class="[
      backgroundColorClass,
    ]"
  >
    <div
      v-if="textured"
      ref="bgContainer"
      class="container-with-bg__bg"
      :style="{
        opacity,
        mixBlendMode,
      }"
    >
      <BrandBackgroundTexture
        :contrast="contrast"
        :theme="preferences.theme"
        :container-height="containerHeight"
      />
    </div>
    <div class="container-with-bg__content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.container-with-bg {
  position: relative;
  width: 100%;
}

.container-with-bg__bg {
  position: absolute;
  z-index: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.container-with-bg__content {
  position: relative;
  z-index: 1;
}
</style>
