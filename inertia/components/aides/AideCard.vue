<script lang="ts" setup>
import type { DsfrCardProps } from '@gouvminint/vue-dsfr'

type AideCardProps = {
  link: string
  titre: string
  description: string
  typeAide: TypeAide
  montant?: number
  instructeur: string
} & Pick<DsfrCardProps, 'horizontal' | 'size' | 'titleTag'>

defineProps<AideCardProps>()
</script>

<template>
  <DsfrCard
    :title="titre"
    :description="description"
    :link="link"
    :detail="instructeur"
    :detail-icon="{ name: 'ri:government-line', ssr: true }"
    v-bind="{
      horizontal,
      size,
      titleTag,
    }"
  >
    <template #start-details>
      <div class="brand-aide-card__details">
        <div class="brand-aide-card__details-left">
          <ul class="fr-tags-group">
            <TypeAideTag
              :size="size"
              :type="typeAide"
            />
          </ul>
        </div>
        <div
          v-if="montant"
          class="brand-aide-card__details-right"
        >
          <AideMontant
            :montant="montant"
            :size="size"
          />
        </div>
      </div>
    </template>
  </DsfrCard>
</template>

<style scoped lang="scss">
.brand-aide-card__details {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

:deep(.fr-card__detail svg) {
  margin-right: .5rem;
}
</style>
