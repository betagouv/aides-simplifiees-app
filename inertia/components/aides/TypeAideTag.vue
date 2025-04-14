<script lang="ts" setup>
import type { DsfrTagProps } from '@gouvminint/vue-dsfr'

const props = withDefaults(defineProps<
  Omit<DsfrTagProps, 'icon'> & {
    type?: TypeAide
  }
>(), {
  type: 'pret',
})
interface TypeAideTag {
  type: TypeAide
  iconName: string
  label: string
}
const typeAideTags: TypeAideTag[] = [
  { type: 'pret', label: 'Prêt', iconName: 'ri:arrow-left-right-line' },
  { type: 'garantie', label: 'Garantie', iconName: 'ri:chat-check-line' },
  { type: 'caution', label: 'Caution', iconName: 'ri:chat-check-line' },
  { type: 'periode', label: '{Période}', iconName: 'ri:calendar-event-line' },
  { type: 'mensuelle', label: 'Tous les mois', iconName: 'ri:calendar-event-line' },
  { type: 'une-fois', label: 'Une seule fois', iconName: 'ri:flashlight-line' },
  { type: 'reduction-impots', label: 'Réduction d’impôts', iconName: 'ri:arrow-right-down-line' },
  { type: 'aide-materielle', label: 'Aide matérielle', iconName: 'ri:shopping-bag-line' },
  { type: 'financements', label: 'Financements', iconName: 'ri:bank-card-line' },
]
const typeAide = typeAideTags.find((tag) => {
  return tag.type === props.type
})

/**
 * The warning in template will be fixed in a future release of @gouvminint/vue-dsfr
 * @see https://github.com/dnum-mi/vue-dsfr/pull/1044
 */
</script>

<template>
  <DsfrTag
    v-if="typeAide"
    class="brand-type-aide-tag"
    v-bind="$props"
    :icon="{ name: typeAide.iconName, ssr: true }"
    :label="typeAide.label"
  />
</template>

<style scoped lang="scss">
.brand-type-aide-tag {
  background-color: var(--background-contrast-info);
  color: var(--text-default-info);
}
</style>
