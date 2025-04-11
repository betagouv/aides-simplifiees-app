<script lang="ts" setup>
import { toRefs, computed } from 'vue';

const props = withDefaults(defineProps<{
  containerHeight?: number | null
  contrast?: boolean
  theme?: 'light' | 'dark'
}>(), {
  containerHeight: null,
  contrast: false,
  theme: 'light',
})
const {
  containerHeight,
  contrast,
  theme,
} = toRefs(props)

const minContainerHeight = 50
type StyleVariantName = 'light' | 'light-contrast' | 'dark' | 'dark-contrast'

const styleVariants: Record<StyleVariantName, Record<string, string>> = {
  'light': {
    'brand-gradient-overlay': 'linear-gradient(90deg, #FFF 10%, rgba(255, 255, 255, 0.00) 100%)',
    'brand-waves-bg': '#FFFFFF',
    'brand-wave-bottom': '#B3B3F9',
    'brand-wave-middle': '#CACAFB',
    'brand-wave-top': '#E3E3FD',
  },
  'light-contrast': {
    'brand-gradient-overlay': 'linear-gradient(90deg, #000091 10%, rgba(0, 0, 145, 0.25) 65%, rgba(225, 0, 15, 0.05) 100%)',
    'brand-waves-bg': '#3535D4',
    'brand-wave-bottom': '#8585F6',
    'brand-wave-middle': '#6A6AF4',
    'brand-wave-top': '#5050E7',
  },
  'dark': {
    'brand-gradient-overlay': 'linear-gradient(90deg, #1E1E1E 10%, rgba(30, 30, 30, 0.00) 100%)',
    'brand-waves-bg': '#1E1E1E',
    'brand-wave-bottom': '#3232AE',
    'brand-wave-middle': '#313178',
    'brand-wave-top': '#272747',
  },
  'dark-contrast': {
    'brand-gradient-overlay': 'linear-gradient(90deg, #000091 10%, rgba(0, 0, 145, 0.25) 65%, rgba(225, 0, 15, 0.05) 100%)',
    'brand-waves-bg': '#3535D4',
    'brand-wave-bottom': '#272747',
    'brand-wave-middle': '#313178',
    'brand-wave-top': '#3232AE',
  }
}

const styleVariantName = computed<StyleVariantName>(() => {
  return contrast.value
    ? `${theme.value}-contrast`
    : theme.value
})
const styleVariant = computed(() => {
  return styleVariants[styleVariantName.value]
})

interface WaveDefinition {
  name: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  breakpoint: number
  width: number
  height: number
  waves: {
    top: string
    middle: string
    bottom: string
  }
}

const waves: WaveDefinition[] = [
  {
    name: 'xs',
    breakpoint: 0,
    width: 1920,
    height: 200,
    waves: {
      top: 'M1920 8.86823V200.498H0V8.86823C102.914 19.978 203.227 31.6236 310.978 35.0561C346.89 36.2045 383.222 36.4257 419.365 35.826C491.433 34.6861 565.737 30.1052 635.706 23.7337C746.761 13.4321 856.3 0.497637 973.953 0.518903C1017.75 0.327503 1061.48 1.595 1104.45 4.0747C1199.17 9.51474 1289.66 20.7053 1384.8 27.2299C1593.55 42.172 1724.13 31.9597 1920 8.86823Z',
      middle: 'M1920 83.6278V200.5H0V87.3417C74.5881 93.4705 149.203 99.6291 223.737 105.741C313.85 113.075 400.616 120.051 492.246 122.884C565.033 125.179 638.903 124.54 710.985 120.349C875.564 111.657 1019.84 80.1396 1188.57 77.729C1317.67 75.0927 1440.69 87.9295 1564.85 95.336C1693.7 103.13 1797.35 96.4093 1920 83.6278Z',
      bottom: 'M1920 192.848V200.496H0V182.302C150.91 181.38 298.068 181.992 447.312 175.952C548.451 171.998 649.198 165.118 747.181 156.526C863.71 146.192 974.807 136.814 1094.76 140.756C1286.85 145.517 1446.94 185.33 1633.68 196.428C1668.72 198.514 1704.42 199.584 1739.98 199.609C1800.78 199.75 1862.03 196.386 1920 192.848Z'
    },
  },
  {
    name: 'sm',
    breakpoint: 250,
    width: 1920,
    height: 200,
    waves: {
      top: 'M1920 8.86823V200.498H0V8.86823C102.914 19.978 203.227 31.6236 310.978 35.0561C346.89 36.2045 383.222 36.4257 419.365 35.826C491.433 34.6861 565.737 30.1052 635.706 23.7337C746.761 13.4321 856.3 0.497637 973.953 0.518903C1017.75 0.327503 1061.48 1.595 1104.45 4.0747C1199.17 9.51474 1289.66 20.7053 1384.8 27.2299C1593.55 42.172 1724.13 31.9597 1920 8.86823Z',
      middle: 'M1920 83.6278V200.5H0V87.3417C74.5881 93.4705 149.203 99.6291 223.737 105.741C313.85 113.075 400.616 120.051 492.246 122.884C565.033 125.179 638.903 124.54 710.985 120.349C875.564 111.657 1019.84 80.1396 1188.57 77.729C1317.67 75.0927 1440.69 87.9295 1564.85 95.336C1693.7 103.13 1797.35 96.4093 1920 83.6278Z',
      bottom: 'M1920 192.848V200.496H0V182.302C150.91 181.38 298.068 181.992 447.312 175.952C548.451 171.998 649.198 165.118 747.181 156.526C863.71 146.192 974.807 136.814 1094.76 140.756C1286.85 145.517 1446.94 185.33 1633.68 196.428C1668.72 198.514 1704.42 199.584 1739.98 199.609C1800.78 199.75 1862.03 196.386 1920 192.848Z'
    },
  },
  {
    name: 'md',
    breakpoint: 500,
    width: 1920,
    height: 400,
    waves: {
      top: 'M1920 16.8378V400H0V16.8378C102.914 39.1918 203.227 62.6241 310.978 69.5305C346.89 71.8413 383.222 72.2863 419.365 71.0796C491.433 68.786 565.737 59.5688 635.706 46.7487C746.761 26.0207 856.3 -0.00475535 973.953 0.0380356C1017.75 -0.347083 1061.48 2.20326 1104.45 7.19268C1199.17 18.1386 1289.66 40.6552 1384.8 53.7835C1593.55 83.8484 1724.13 63.3002 1920 16.8378Z',
      middle: 'M1920 165.6V400H0V173.087C74.5881 185.442 149.203 197.858 223.737 210.179C313.85 224.964 400.616 239.029 492.246 244.738C565.033 249.366 638.903 248.078 710.985 239.63C875.564 222.105 1019.84 158.568 1188.57 153.708C1317.67 148.393 1440.69 174.272 1564.85 189.203C1693.7 204.916 1797.35 191.367 1920 165.6Z',
      bottom: 'M1920 385.802V400H0V364.555C150.91 362.698 298.068 363.93 447.312 351.763C548.451 343.796 649.198 329.934 747.181 312.624C863.71 291.805 974.807 272.912 1094.76 280.853C1286.85 290.445 1446.94 370.656 1633.68 393.015C1668.72 397.216 1704.42 399.373 1739.98 399.424C1800.78 399.706 1862.03 392.929 1920 385.802Z'
    }
  },
  {
    name: 'lg',
    breakpoint: 1000,
    width: 1920,
    height: 600,
    waves: {
      top: 'M1920 16.4859V600.5H0V16.4859C102.914 37.7089 203.227 59.9557 310.978 66.5128C346.89 68.7066 383.222 69.1291 419.365 67.9834C491.433 65.8059 565.737 57.055 635.706 44.8835C746.761 25.2042 856.3 0.495485 973.953 0.536111C1017.75 0.170477 1061.48 2.59179 1104.45 7.32878C1199.17 17.7209 1289.66 39.0983 1384.8 51.5624C1593.55 80.1063 1724.13 60.5976 1920 16.4859Z',
      middle: 'M1920 272.698V600.303H0V282.027C74.5881 297.422 149.203 312.892 223.737 328.244C313.85 346.666 400.616 364.19 492.246 371.305C565.033 377.071 638.903 375.466 710.985 364.939C875.564 343.104 1019.84 263.936 1188.57 257.881C1317.67 251.259 1440.69 283.503 1564.85 302.108C1693.7 321.686 1797.35 304.804 1920 272.698Z',
      bottom: 'M1920 583.195V600.337H0V557.543C150.91 555.301 298.068 556.789 447.312 542.099C548.451 532.481 649.198 515.745 747.182 494.845C863.71 469.71 974.807 446.9 1094.76 456.487C1286.85 468.068 1446.94 564.909 1633.68 591.904C1668.72 596.976 1704.42 599.579 1739.98 599.641C1800.78 599.982 1862.03 591.8 1920 583.195Z'
    }
  },
  {
    name: 'xl',
    breakpoint: 1500,
    width: 1920,
    height: 800,
    waves: {
      top: 'M1920 25.0303V800H0V25.0303C102.914 58.2609 203.227 93.0945 310.978 103.361C346.89 106.796 383.222 107.458 419.365 105.664C491.433 102.254 565.737 88.5526 635.706 69.4947C746.761 38.6813 856.3 -0.0070691 973.953 0.0565422C1017.75 -0.51596 1061.48 3.27527 1104.45 10.6924C1199.17 26.9641 1289.66 60.4364 1384.8 79.9524C1593.55 124.646 1724.13 94.0995 1920 25.0303Z',
      middle: 'M1920 337.763V799.999H0V349.613C74.5881 369.167 149.203 388.817 223.737 408.317C313.85 431.717 400.616 453.976 492.246 463.013C565.033 470.337 638.903 468.299 710.985 454.927C875.564 427.192 1019.84 326.634 1188.57 318.942C1317.67 310.531 1440.69 351.488 1564.85 375.119C1693.7 399.987 1797.35 378.544 1920 337.763Z',
      bottom: 'M1920 778.988V799.999H0V748.091C150.91 745.391 298.068 747.183 447.312 729.488C548.451 717.903 649.198 697.744 747.181 672.57C863.71 642.295 974.807 614.819 1094.76 626.367C1286.85 640.316 1446.94 756.963 1633.68 789.478C1668.72 795.588 1704.42 798.724 1739.98 798.799C1800.78 799.209 1862.03 789.354 1920 778.988Z',
    }
  }
]
const wave = computed<WaveDefinition | null>(() => {
  if (containerHeight.value === null) {
    return null
  }
  // Find the largest breakpoint that is smaller than the current container height
  return [...waves]
    .sort((a, b) => a.breakpoint - b.breakpoint)
    .filter(({ breakpoint }) => (containerHeight.value as number) > breakpoint)
    ?.pop() ?? null
})
</script>

<template>
  <div
    v-if="wave && containerHeight && (containerHeight > minContainerHeight)"
    class="waves-container"
    :class="[
      `waves-container--${wave.name}`,
    ]"
    :style="{
      background: styleVariant['brand-waves-bg'],
    }"
  >
    <div
      class="waves-background"
      :style="{
        background: styleVariant['brand-waves-bg'],
      }"
    />
    <div
      class="waves"
      :style="{
        height: wave.name === 'xs' ? `${(containerHeight - 50)}px` : `${wave.height}px`,
      }"
    >
      <svg
        aria-hidden="true"
        :height="wave.name === 'xs' ? `${(containerHeight - 50)}px` : `${wave.height}px`"
        :width="wave.width"
        preserveAspectRatio="none"
        :viewBox="`0 0 ${wave.width} ${wave.height}`"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          class="brand-wave-top"
          :d="wave.waves.top"
          :fill="styleVariant['brand-wave-top']"
        />
        <path
          class="brand-wave-middle"
          :d="wave.waves.middle"
          :fill="styleVariant['brand-wave-middle']"
        />
        <path
          class="brand-wave-bottom"
          :d="wave.waves.bottom"
          :fill="styleVariant['brand-wave-bottom']"
        />
      </svg>
    </div>
    <div
      class="waves-foreground"
      :style="{
        background: styleVariant['brand-wave-bottom'],
      }"
    />
    <div
      class="gradient-overlay"
      :style="{
        background: styleVariant['brand-gradient-overlay'],
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.waves-container {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 0;

  .waves-background,
  .waves-foreground {
    width: 100%;
  }

  &:not(.waves-container--xs) {

    display: flex;
    flex-direction: column;

    .waves-background,
    .waves-foreground {
      flex: 1;
    }
  }

  &.waves-container--xs {

    .waves-background,
    .waves-foreground {
      height: 25px;
    }
  }
}

.content-container {
  position: relative;
  z-index: 1;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
}
</style>
