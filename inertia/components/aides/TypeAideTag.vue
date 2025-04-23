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
  { type: 'aide-financiere', label: 'Aide financière', iconName: 'ri:money-euro-circle-line' },
  { type: 'pret', label: 'Prêt', iconName: 'ri:arrow-left-right-line' },
  { type: 'garantie', label: 'Garantie', iconName: 'ri:chat-check-line' },
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
