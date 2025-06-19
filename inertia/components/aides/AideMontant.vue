<script setup lang="ts">
withDefaults(
  defineProps<{
    montant: number
    size?: 'md' | 'medium' | 'large' | 'lg' | 'sm' | 'small' | undefined
  }>(),
  {
    size: 'md',
  },
)

function formatMontant(montant: number): string {
  return montant
    .toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
}
</script>

<template>
  <div
    class="brand-montant fr-text--alt"
    :class="[`brand-montant--${size}`]"
  >
    <p class="brand-montant__label fr-m-0">
      {{ formatMontant(montant) }}
    </p>
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
    font-size: inherit;
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
