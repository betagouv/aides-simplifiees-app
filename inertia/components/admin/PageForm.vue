<script setup lang="ts">
import type AdminPageController from '#controllers/admin/admin_page_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrInputGroup, DsfrSelect } from '@gouvminint/vue-dsfr'
import { useForm } from '@inertiajs/vue3'
import AdminForm from '~/components/admin/AdminItemFormContainer.vue'
import DsfrSlugInput from '~/components/admin/DsfrSlugInput.vue'
import RichTextEditor from '~/components/admin/RichTextEditor.vue'

const props = defineProps<{
  defaultValues?: InferPageProps<AdminPageController, 'edit'>['page']
}>()

defineEmits<{
  (e: 'submit', form: PageFormType): void
  (e: 'cancel'): void
}>()

// Initialize form with default values or empty strings
const form = useForm({
  title: props.defaultValues?.title || '',
  slug: props.defaultValues?.slug || '',
  status: props.defaultValues?.status || 'draft',
  description: props.defaultValues?.description || '',
  metaDescription: props.defaultValues?.metaDescription || '',
  content: props.defaultValues?.content || '',
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
          hint="Titre complet de la page"
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
          hint="Identifiant unique de la page, utilisé dans l'URL"
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
          hint="Description de la page, susceptible d'être affichée à l'utilisateur"
          :error="form.errors.description"
        />
      </div>
      <div class="fr-col-12 fr-col-md-6">
        <DsfrInputGroup
          v-model="form.metaDescription"
          label="Description méta"
          is-textarea
          label-visible
          hint="Description pour les moteurs de recherche, utilisera la description si laissé vide"
          :error="form.errors.metaDescription"
        />
      </div>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mt-4w">
      <div class="fr-col-12">
        <!-- <div v-if="form.errors.content" >
          {{ form.errors.content }}
        </div> -->
        <RichTextEditor
          v-model="form.content"
        />
      </div>
    </div>
  </AdminForm>
</template>
