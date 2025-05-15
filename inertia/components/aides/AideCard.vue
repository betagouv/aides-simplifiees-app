<script lang="ts" setup>
import type { DsfrCardProps } from '@gouvminint/vue-dsfr'
import { DsfrCard } from '@gouvminint/vue-dsfr'
import { router } from '@inertiajs/vue3'
import AideMontant from '~/components/aides/AideMontant.vue'
import TypeAideTag from '~/components/aides/TypeAideTag.vue'

type AideCardProps = {
  link: string
  title: string
  description: string
  typeAide: TypeAide
  montant?: number
  instructeur: string
} & Pick<DsfrCardProps, 'horizontal' | 'size' | 'titleTag'>

const props = defineProps<AideCardProps>()

const periode = props.title?.match('APL') ? '/mois' : undefined
</script>

<template>
  <DsfrCard
    class="brand-aide-card"
    :title="title"
    no-arrow
    :link="link"
    :description="description"
    :detail="instructeur"
    :detail-icon="{ name: 'ri:government-line', ssr: true }"
    :buttons="[
      {
        label: 'En savoir plus',
        secondary: true,
        icon: { name: 'ri:arrow-right-line', ssr: true },
        iconRight: true,
        onClick: () => {
          router.visit(link)
        },
      },
    ]"
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
          <span class="fr-mr-3v">jusqu'à</span>
          <AideMontant
            :montant="montant"
            :size="size"
          />
          <p
            v-if="periode"
            class="brand-montant-periode fr-mb-n1v fr-text--bold fr-text--alt"
          >
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
  margin-right: .5rem;
}

.brand-montant-periode {
  display: inline-block;
}

.brand-montant-periode {
  display: inline-block;
}
.brand-aide-card:deep(.fr-btns-group) {
  justify-content: flex-end;
}
</style>
