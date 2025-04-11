<script lang="ts" setup>
type SectionType = 'default' | 'grouped-first' | 'grouped' | 'grouped-last' | 'page-breadcrumb' | 'page-header' | 'page-block' | 'page-footer' | 'page-full'

const props = withDefaults(defineProps<{
  type?: SectionType
}>(), {
  type: 'default',
})

/**
 * To understand the padding classes depending on the section type, see the Figma design:
 * @see https://www.figma.com/design/u3SBSBV29qgCFrzMz9JtNv/Maquette-MVP?node-id=818-16496&t=upnJlln1AYd11Dsa-1
 */
const paddingsClassesVariants: Record<SectionType, string[]> = {
  'default': [
    'fr-py-6w',
    'fr-py-sm-8w',
    'fr-py-md-9w',
    'fr-py-lg-12w'
  ],
  'grouped-first': [
    'fr-pt-6w fr-pb-4w',
    'fr-pt-sm-8w fr-pb-sm-6w',
    'fr-pt-md-9w fr-pb-md-7w',
    'fr-pt-lg-12w fr-pb-lg-8w',
  ],
  'grouped': [
    'fr-py-4w',
    'fr-py-sm-6w',
    'fr-py-md-7w',
    'fr-py-lg-8w',
  ],
  'grouped-last': [
    'fr-pt-4w fr-pb-6w',
    'fr-pt-sm-6w fr-pb-sm-8w',
    'fr-pt-md-7w fr-pb-md-9w',
    'fr-pt-lg-8w fr-pb-lg-12w',
  ],
  'page-breadcrumb': [
    'fr-pt-3w fr-pb-1w',
    'fr-pt-sm-4w fr-pb-sm-3v',
    'fr-pt-md-5w fr-pb-md-2w',
    'fr-pt-lg-6w fr-pb-lg-3w',
  ],
  'page-header': [
    'fr-pt-1w fr-pb-3w',
    'fr-pt-sm-3v fr-pb-sm-4w',
    'fr-pt-md-2w fr-pb-md-5w',
    'fr-pt-lg-3w fr-pb-lg-6w',
  ],
  'page-block': [
    'fr-py-3w',
    'fr-py-sm-4w',
    'fr-py-md-5w',
    'fr-py-lg-6w',
  ],
  'page-footer': [
    'fr-pt-3w fr-pb-6w',
    'fr-pt-sm-4w fr-pb-sm-8w',
    'fr-pt-md-5w fr-pb-md-9w',
    'fr-pt-lg-6w fr-pb-lg-12w',
  ],
  'page-full': [
    'fr-pt-1w fr-pb-6w',
    'fr-pt-sm-3v fr-pb-sm-8w',
    'fr-pt-md-2w fr-pb-md-9w',
    'fr-pt-lg-3w fr-pb-lg-12w',
  ]
}
const paddingsClasses = paddingsClassesVariants[props.type].join(' ')
</script>

<template>
  <component
    :is="type === 'page-breadcrumb' ? 'div' : 'section'"
    :class="[{
      [`brand-section--${type}`]: Boolean(type),
      [paddingsClasses]: Boolean(paddingsClasses),
    }]"
  >
    <div class="fr-container">
      <slot />
    </div>
  </component>
</template>

<style lang="scss"></style>
