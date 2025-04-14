<script setup lang="ts">
withDefaults(defineProps<{
  montant: number
  size?: 'md' | 'medium' | 'large' | 'lg' | 'sm' | 'small' | undefined
}>(), {
  size: 'md',
})
</script>

<template>
  <div
    class="brand-montant fr-text--alt"
    :class="[
      `brand-montant--${size}`,
    ]"
  >
    <div class="brand-montant__label">
      {{ montant.toFixed(0) }}€
    </div>
  </div>
</template>

<style scoped lang="scss">
.brand-montant {
  font-weight: 700;
  position: relative;
  display: inline-block;
  width: min-content;
  line-height: 1;

  &--sm {
    font-size: 1.25rem;
  }

  &--md {
    font-size: 1.5rem;
  }

  &--lg {
    font-size: 2rem;
  }

  .brand-montant__label {
    position: relative;
    z-index: 1;
  }
  &::after {
    content: '';
    position: absolute;
    z-index: 0;
    top: 50%;
    right: 0.15em;
    left: -0.15em;
    bottom: 0;
    background: var(--blue-france-950-100);
  }
}
</style>
