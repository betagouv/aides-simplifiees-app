<script setup lang="ts">
import type AdminSimulateurController from '#controllers/admin/admin_simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrInputGroup, DsfrSelect, DsfrToggleSwitch } from '@gouvminint/vue-dsfr'
import { useForm } from '@inertiajs/vue3'
import AdminForm from '~/components/admin/AdminItemFormContainer.vue'
import DsfrSlugInput from '~/components/admin/DsfrSlugInput.vue'

const props = defineProps<{
  defaultValues?: InferPageProps<AdminSimulateurController, 'edit'>['simulateur']
}>()

defineEmits<{
  (e: 'submit', form: SimulateurFormType): void
  (e: 'cancel'): void
}>()

// Initialize form with default values or empty strings
const form = useForm({
  title: props.defaultValues?.title || '',
  slug: props.defaultValues?.slug || '',
  status: props.defaultValues?.status || 'draft',
  description: props.defaultValues?.description || '',
  metaDescription: props.defaultValues?.metaDescription || '',
  pictogramPath: props.defaultValues?.pictogramPath || '',
  usesPublicodesForms: Boolean(props.defaultValues?.usesPublicodesForms),
})
</script>

<template>
  <AdminForm
    :form="form"
    @submit="$emit('submit', form)"
    @cancel="$emit('cancel')"
  >
    <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">
      <div class="fr-col-12 fr-col-md-4">
        <DsfrSelect
          v-model="form.status"
          label="Statut"
          :options="[
            { value: 'draft', text: 'Brouillon' },
            { value: 'published', text: 'Publié' },
            { value: 'unlisted', text: 'Non répertorié' },
          ]"
          required
          :error="form.errors.status"
        />
      </div>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12 fr-col-md-6">
        <DsfrInputGroup
          v-model="form.title"
          label="Titre"
          label-visible
          required
          hint="Titre complet du simulateur"
          :error="form.errors.title"
        />
      </div>
      <div class="fr-col-12 fr-col-md-6">
        <DsfrSlugInput
          v-model="form.slug"
          :error="form.errors.slug"
          :slugify-from="form.title"
          label="Slug"
          button-label="Générer à partir du titre"
          required
          label-visible
          hint="Identifiant unique du simulateur (ex: simulateur-logement)"
        />
      </div>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mt-4w">
      <div class="fr-col-12 fr-col-md-6">
        <DsfrInputGroup
          v-model="form.description"
          label="Description"
          is-textarea
          label-visible
          hint="Description du simulateur"
          :error="form.errors.description"
        />
      </div>
      <div class="fr-col-12 fr-col-md-6">
        <DsfrInputGroup
          v-model="form.metaDescription"
          label="Description méta"
          is-textarea
          label-visible
          hint="Description pour les moteurs de recherche"
          :error="form.errors.metaDescription"
        />
      </div>
      <div class="fr-col-12 fr-col-md-6">
        <DsfrInputGroup
          v-model="form.pictogramPath"
          label="Chemin du pictogramme"
          label-visible
          hint="Chemin relatif vers le pictogramme (ex: /img/pictograms/logement.svg)"
          :error="form.errors.pictogramPath"
        />
      </div>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-mt-4w">
      <div class="fr-col-12 fr-col-md-4">
        <DsfrToggleSwitch
          v-model="form.usesPublicodesForms"
          label="Utiliser Publicodes/form"
          label-visible
          hint="Activez cette option pour utiliser le formulaire Publicodes pour ce simulateur"
          :error="form.errors.usesPublicodesForms"
        />
      </div>
    </div>
  </AdminForm>
</template>
