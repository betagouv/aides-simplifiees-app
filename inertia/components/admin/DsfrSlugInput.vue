<script setup lang="ts">
import { DsfrButton, DsfrInputGroup } from '@gouvminint/vue-dsfr'
import slugify from 'slugify'
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  slugifyFrom: string
  buttonLabel?: string
}>(), {
  buttonLabel: 'Générer le slug',
})

const model = defineModel<string>()

// Function to generate slug from another field
function generateSlug() {
  if (props.slugifyFrom) {
    model.value = slugify(props.slugifyFrom, {
      lower: true,
      strict: true,
    })
  }
}

// Watch slug input and slugify it as the user types
watch(model, (newValue, oldValue) => {
  // Only slugify if the value has actually changed (prevents infinite loops)
  if (newValue && newValue !== oldValue) {
    const newSlug = slugify(newValue, {
      lower: true,
      strict: true,
    })
    if (newValue !== newSlug) {
      model.value = newSlug
    }
  }
})
</script>

<template>
  <div>
    <DsfrInputGroup
      v-bind="$attrs"
      v-model="model"
    />
    <DsfrButton
      size="sm"
      secondary
      :label="buttonLabel"
      :icon="{ name: 'ri:magic-line', ssr: true }"
      @click.prevent="generateSlug"
    />
  </div>
</template>
