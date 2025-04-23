<script setup lang="ts">
import { VIcon } from '@gouvminint/vue-dsfr'
import AideMontant from '~/components/aides/AideMontant.vue'

const props = defineProps<{
  usageAide: UsageAide
  montant: number
  periode?: string
}>()

interface RichUSageAide {
  description: string
  icon?: string
  periode?: string
}
function formatUsageAide(usageAide: UsageAide): RichUSageAide {
  const usageAideMap: Record<UsageAide, RichUSageAide> = {
    'loyer-logement': {
      icon: 'ri:home-4-line',
      description: 'Pour payer <b>votre loyer</b>',
      periode: '/mois',
    },
    'frais-installation-logement': {
      icon: 'ri:truck-line',
      description: 'Pour couvrir les dépenses liées à <b>l\'installation dans votre logement</b>',
    },
    'caution-logement': {
      icon: 'ri:chat-check-line',
      description: 'Pour payer votre <b>caution</b>',
    },
    'pret-garantie-logement': {
      icon: 'ri:arrow-left-right-line',
      description: 'Prêt à 0% pour financer votre <b>dépôt de garantie</b>',
    },
  }

  return usageAideMap[usageAide] || ''
}
const richUsageAide = formatUsageAide(props.usageAide)
</script>

<template>
  <div class="brand-rich-aide-montant">
    <div class="brand-rich-aide-montant__description">
      <p class="fr-m-0 fr-text--lg brand-rich-aide-montant__description-text">
        <VIcon
          :name="richUsageAide.icon"
          ssr
          :style="{ width: '1.5rem', height: '1.5rem' }"
        />
        <span
          class="fr-m-0"
          v-html="richUsageAide.description"
        />
      </p>
    </div>
    <div class="brand-rich-aide-montant__montant">
      <p class="brand-rich-aide-montant__prefix fr-mb-n1v fr-mr-3v">
        jusqu'à
      </p>
      <AideMontant
        size="lg"
        :montant="montant"
      />
      <p
        v-if="richUsageAide.periode"
        class="brand-montant-periode fr-mb-n1v fr-text--alt"
      >
        {{ richUsageAide.periode }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.brand-rich-aide-montant {
  display: flex;
  gap: 3rem;
  align-items: center;
  justify-content: space-between;
}

.brand-rich-aide-montant__description-text {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-rich-aide-montant__montant {
  display: flex;
  align-items: flex-end;
}

.brand-montant-periode {
  font-size: 1.25rem;
  font-weight: 700;
}
</style>
