<script setup lang="ts">
import { DsfrButton, DsfrInputGroup, DsfrSelect } from '@gouvminint/vue-dsfr'
import { useForm } from '@inertiajs/vue3'
import AdminForm from '~/components/admin/AdminForm.vue'
import DsfrSlugInput from '~/components/admin/DsfrSlugInput.vue'
import RichTextEditor from '~/components/admin/RichTextEditor.vue'

const props = defineProps<{
  defaultValues?: SerializedAide
}>()

defineEmits<{
  (e: 'submit', form: AideForm): void
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
  type: props.defaultValues?.type || '',
  usage: props.defaultValues?.usage || '',
  instructeur: props.defaultValues?.instructeur || '',
  textesLoi: props.defaultValues?.textesLoi || [],
})

// Gérer les textes de loi (tableau d'objets)
function addTexteLoi() {
  form.textesLoi.push({ prefix: '', label: '', url: '' })
}

function removeTexteLoi(index: number) {
  form.textesLoi.splice(index, 1)
}
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
          hint="Titre complet de l'aide"
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
          hint="Identifiant unique de l'aide, utilisé dans l'URL"
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
          hint="Description de l'aide, susceptible d'être affichée à l'utilisateur"
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

    <div class="fr-grid-row fr-grid-row--gutters fr-mt-4w">
      <div class="fr-col-12 fr-col-md-4">
        <DsfrInputGroup
          v-model="form.type"
          label="Type"
          label-visible
          hint="Type d'aide"
          :error="form.errors.type"
        />
      </div>
      <div class="fr-col-12 fr-col-md-4">
        <DsfrInputGroup
          v-model="form.usage"
          label="Usage"
          label-visible
          hint="Usage de l'aide"
          :error="form.errors.usage"
        />
      </div>
      <div class="fr-col-12 fr-col-md-4">
        <DsfrInputGroup
          v-model="form.instructeur"
          label="Instructeur"
          label-visible
          hint="Organisme instructeur"
          :error="form.errors.instructeur"
        />
      </div>
    </div>

    <div class="fr-grid-row fr-grid-row--gutters fr-mt-4w">
      <div class="fr-col-12">
        <h3>Textes de loi</h3>
        <DsfrButton
          secondary
          label="Ajouter un texte de loi"
          :icon="{ name: 'ri:add-line', ssr: true }"
          @click="addTexteLoi"
        />
      </div>
      <div
        v-for="(texteLoi, index) in form.textesLoi"
        :key="index"
      >
        <DsfrInputGroup
          v-model="texteLoi.prefix"
          label="Préfixe"
          label-visible
          placeholder="Art."
        />
        <DsfrInputGroup
          v-model="texteLoi.label"
          label="Référence"
          label-visible
          placeholder="L. 123-45 du Code de l'action sociale"
        />
        <DsfrInputGroup
          v-model="texteLoi.url"
          label="URL"
          label-visible
          placeholder="https://www.legifrance.gouv.fr/..."
        />
        <DsfrButton
          secondary
          label="Supprimer le texte de loi"
          :icon="{ name: 'ri:delete-bin-2-line', ssr: true }"
          @click="removeTexteLoi(index)"
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
