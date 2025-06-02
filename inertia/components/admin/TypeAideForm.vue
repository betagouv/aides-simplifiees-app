<script lang="ts" setup>
import type AdminTypeAideController from '#controllers/admin/admin_type_aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrInput, DsfrSelect } from '@gouvminint/vue-dsfr'
import { useForm } from '@inertiajs/vue3'
import AdminForm from '~/components/admin/AdminItemFormContainer.vue'
import DsfrSlugInput from '~/components/admin/DsfrSlugInput.vue'
import { ri } from '~/icon_collections'

const props = defineProps<{
  defaultValues?: InferPageProps<AdminTypeAideController, 'edit'>['typeAide']
}>()

defineEmits<{
  (e: 'submit', form: AideForm): void
  (e: 'cancel'): void
}>()

const form = useForm({
  label: props.defaultValues?.label || '',
  slug: props.defaultValues?.slug || '',
  iconName: props.defaultValues?.iconName || '',
})

// Extract available icons from the ri constant
const availableIcons = Object.entries(ri).map(([key, value]) => ({
  value,
  text: key,
}))
</script>

<template>
  <AdminForm
    :form="form"
    @submit="$emit('submit', form)"
    @cancel="$emit('cancel')"
  >
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12 fr-col-md-4">
        <DsfrInput
          v-model="form.label"
          label="Label"
          label-visible
          name="label"
          required
        />
      </div>
      <div class="fr-col-12 fr-col-md-4">
        <DsfrSlugInput
          v-model="form.slug"
          :error="form.errors.slug"
          :slugify-from="form.label"
          label="Slug"
          button-label="Générer à partir du label"
          required
          label-visible
          hint="Identifiant unique de l'aide, utilisé dans l'URL"
        />
      </div>
      <div class="fr-col-12 fr-col-md-4">
        <DsfrSelect
          v-model="form.iconName"
          label="Icône"
          name="iconName"
          :options="availableIcons"
          required
        />
      </div>
    </div>
  </AdminForm>
</template>
