<script lang="ts" setup>
import type { DsfrCardProps } from '@gouvminint/vue-dsfr'
import TypeAideTag from '~/components/aides/TypeAideTag.vue'
import AideMontant from '~/components/aides/AideMontant.vue'

type AideCardProps = {
  link: string
  titre: string
  description: string
  typeAide: TypeAide
  montant?: number
  instructeur: string
} & Pick<DsfrCardProps, 'horizontal' | 'size' | 'titleTag'>

const props = defineProps<AideCardProps>()

const periode = props.titre?.match('APL') ? '/mois' : undefined
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
            <TypeAideTag :size="size" :type="typeAide" />
          </ul>
        </div>
        <div v-if="montant" class="brand-aide-card__details-right">
          <span class="fr-mr-3v">jusqu'à</span>
          <AideMontant :montant="montant" :size="size" />
          <p v-if="periode" class="brand-montant-periode fr-mb-n1v fr-text--bold fr-text--alt">
            {{ periode }}
          </p>
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
  margin-right: 0.5rem;
}

.brand-montant-periode {
  display: inline-block;
}
</style>
