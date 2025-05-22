<script setup lang="ts" generic="T extends { [key: string]: any }">
import type { InertiaForm } from '@inertiajs/vue3'
import { DsfrButtonGroup } from '@gouvminint/vue-dsfr'

defineProps<{
  form: InertiaForm<T>
}>()

defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <form @submit.prevent="$emit('submit')">
    <slot />
    <div class="fr-mt-4w fr-grid-row fr-grid-row--right">
      <DsfrButtonGroup
        equisized
        size="lg"
        inline-layout-when="always"
        :buttons="[
          {
            label: 'Annuler',
            secondary: true,
            onClick: (event => {
              event.preventDefault()
              $emit('cancel')
            }),
            icon: { name: 'ri:arrow-left-line', ssr: true },
          },
          {
            label: 'Enregistrer',
            icon: { name: 'ri:save-line', ssr: true },
            type: 'submit',
            iconRight: true,
            disabled: form.processing,
          },
        ]"
      />
    </div>
  </form>
</template>
