<script setup lang="ts">
import type AdminAideController from '#controllers/admin/admin_aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrButton, DsfrInputGroup, DsfrSelect } from '@gouvminint/vue-dsfr'
import { useForm } from '@inertiajs/vue3'
import { ref } from 'vue'
import AdminForm from '~/components/admin/AdminItemFormContainer.vue'
import DsfrSlugInput from '~/components/admin/DsfrSlugInput.vue'
import RichTextEditor from '~/components/admin/RichTextEditor.vue'
import DsfrSelectPatch from '~/components/DsfrSelectPatch.vue'

const props = defineProps<{
  defaultValues?: InferPageProps<AdminAideController, 'edit'>['aide']
  typesAide: Array<{ id: number, label: string }>
}>()

defineEmits<{
  (e: 'submit', form: AideFormType): void
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
  typeAideId: props.defaultValues?.typeAideId,
  usage: props.defaultValues?.usage || '',
  instructeur: props.defaultValues?.instructeur || '',
  /**
   * Below a useless mapping to make sure the `textesLoi` pass typechecking.
   * @see https://github.com/inertiajs/inertia/issues/1193
   */
  textesLoi: (props.defaultValues?.textesLoi || [] as TexteLoi[]).map(texte => ({
    label: texte.label,
    url: texte.url,
  })),
  dsEnabled: props.defaultValues?.dsEnabled ? 'true' : 'false',
  dsDemarcheId: props.defaultValues?.dsDemarcheId || '',
  dsFieldMapping: props.defaultValues?.dsFieldMapping || {},
})
// Gérer les textes de loi (tableau d'objets)
function addTexteLoi() {
  form.textesLoi?.push({ label: '', url: '' })
}

function removeTexteLoi(index: number) {
  form.textesLoi?.splice(index, 1)
}

// Gérer les mappings DS (objet clé-valeur)
const dsMappingEntries = ref<Array<{ dsFieldKey: string, questionId: string }>>(
  Object.entries(props.defaultValues?.dsFieldMapping || {}).map(([dsFieldKey, questionId]) => ({
    dsFieldKey,
    questionId,
  })),
)

function addDsMapping() {
  dsMappingEntries.value.push({ dsFieldKey: '', questionId: '' })
}

function removeDsMapping(index: number) {
  dsMappingEntries.value.splice(index, 1)
}

// Synchroniser dsMappingEntries avec form.dsFieldMapping
function syncDsFieldMapping() {
  form.dsFieldMapping = dsMappingEntries.value.reduce((acc: Record<string, string>, entry: { dsFieldKey: string, questionId: string }) => {
    if (entry.dsFieldKey && entry.questionId) {
      acc[entry.dsFieldKey] = entry.questionId
    }
    return acc
  }, {} as Record<string, string>)
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
      <div class="fr-col-12 fr-col-md-6">
        <DsfrSelectPatch
          v-model="form.typeAideId"
          label="Type"
          :options="typesAide?.map(type => ({ value: type.id, text: type.label })) || []"
          label-visible
          hint="Type d'aide"
          :error="form.errors.typeAideId"
        />
      </div>
      <!-- <div class="fr-col-12 fr-col-md-4">
      <DsfrInputGroup
        v-model="form.usage"
        label="Usage"
        label-visible
        hint="Usage de l'aide"
        :error="form.errors.usage"
      />
    </div> -->
      <div class="fr-col-12 fr-col-md-6">
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
          type="button"
          @click="addTexteLoi"
        />
      </div>
      <template
        v-for="(texteLoi, index) in form.textesLoi"
        :key="index"
      >
        <div
          v-if="texteLoi"
          class="fr-col-12 fr-col-md-6 fr-mb-2w"
        >
          <div class="fr-card fr-p-2w">
            <DsfrInputGroup
              v-model="texteLoi.label"
              label="Label"
              label-visible
              placeholder="Ex: L. 123-45 du Code de l'action sociale"
            />
            <DsfrInputGroup
              v-model="texteLoi.url"
              label="URL"
              label-visible
              placeholder="Ex: https://www.legifrance.gouv.fr/..."
            />
            <DsfrButton
              label="Supprimer le texte de loi"
              :icon="{ name: 'ri:delete-bin-2-line', ssr: true }"
              type="button"
              tertiary
              no-outline
              @click="removeTexteLoi(index)"
            />
          </div>
        </div>
      </template>
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

    <!-- Démarches Simplifiées Integration -->
    <div class="fr-grid-row fr-grid-row--gutters fr-mt-6w">
      <div class="fr-col-12">
        <h2 class="fr-h4">
          Intégration avec Démarches Simplifiées
        </h2>
        <p class="fr-text--sm">
          Activez l'intégration pour permettre aux utilisateurs de préremplir leur dossier sur Démarches Simplifiées avec les réponses du simulateur.
        </p>
      </div>

      <div class="fr-col-12 fr-col-md-6">
        <DsfrSelectPatch
          v-model="form.dsEnabled"
          label="Activer l'association avec Démarches Simplifiées"
          :options="[
            { value: 'false', text: 'Non' },
            { value: 'true', text: 'Oui' },
          ]"
          label-visible
          :error="form.errors.dsEnabled"
        />
      </div>

      <template v-if="form.dsEnabled === 'true'">
        <div class="fr-col-12 fr-col-md-6">
          <DsfrInputGroup
            v-model="form.dsDemarcheId"
            label="ID de la démarche Démarches Simplifiées"
            label-visible
            required
            hint="L'identifiant numérique de la démarche sur demarches-simplifiees.fr (ex: 12345)"
            placeholder="Ex: 12345"
            :error="form.errors.dsDemarcheId"
          />
        </div>

        <div class="fr-col-12 fr-mt-4w">
          <h3 class="fr-h6">
            Mapping des champs
          </h3>
          <p class="fr-text--sm">
            Associez les champs de Démarches Simplifiées (clé en base64) aux questions du simulateur (ID de question du JSON).
          </p>
          <DsfrButton
            secondary
            label="Ajouter un mapping"
            :icon="{ name: 'ri:add-line', ssr: true }"
            type="button"
            @click="addDsMapping"
          />
        </div>

        <template
          v-for="(mapping, index) in dsMappingEntries"
          :key="index"
        >
          <div class="fr-col-12 fr-mb-2w">
            <div class="fr-card fr-p-2w">
              <div class="fr-grid-row fr-grid-row--gutters">
                <div class="fr-col-12 fr-col-md-6">
                  <DsfrInputGroup
                    v-model="mapping.dsFieldKey"
                    label="Clé du champ DS"
                    label-visible
                    placeholder="Ex: champ_Q2hhbXAtMTx0MjM2OX=="
                    hint="La clé en base64 du champ dans Démarches Simplifiées"
                    @blur="syncDsFieldMapping"
                  />
                </div>
                <div class="fr-col-12 fr-col-md-6">
                  <DsfrInputGroup
                    v-model="mapping.questionId"
                    label="ID de la question du simulateur"
                    label-visible
                    placeholder="Ex: statut-professionnel"
                    hint="L'ID de la question dans le fichier JSON du formulaire"
                    @blur="syncDsFieldMapping"
                  />
                </div>
              </div>
              <DsfrButton
                label="Supprimer le mapping"
                :icon="{ name: 'ri:delete-bin-2-line', ssr: true }"
                type="button"
                tertiary
                no-outline
                @click="removeDsMapping(index)"
              />
            </div>
          </div>
        </template>
      </template>
    </div>
  </AdminForm>
</template>
