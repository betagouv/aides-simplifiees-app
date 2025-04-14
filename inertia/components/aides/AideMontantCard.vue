<script setup lang="ts">
defineProps<{
  type: TypeAide
  montant: number
  prefix?: string
  suffix?: string
}>()
</script>

<template>
  <div class="fr-card fr-card--sm brand-rich-aide-montant">
    <div class="fr-card__body">
      <div class="fr-card__content">
        <div class="fr-card__start brand-rich-aide-montant__type fr-mb-n1w">
          <TypeAideTag :type="type" />
        </div>
        <div class="fr-card__end brand-rich-aide-montant__montant">
          <span
            v-if="prefix"
            class="brand-rich-aide-montant__prefix"
          >
            {{ prefix }}
          </span>
          <AideMontant
            size="lg"
            :montant="montant"
          />
          <span
            v-if="suffix"
            class="brand-rich-aide-montant__suffix"
          >
            {{ suffix }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.brand-rich-aide-montant__montant {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
</style>
