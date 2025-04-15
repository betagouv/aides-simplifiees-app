<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3'
import { ref } from 'vue'
import DefaultLayout from '../../../layouts/default.vue'
import BrandBackgroundContainer from '../../../components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '../../../components/layout/SectionContainer.vue'
import { marked } from 'marked'

const form = useForm({
  title: '',
  content: '',
  description: '',
  type: '',
  usage: '',
  instructeur: '',
  textesLoi: [] as Array<{ prefix: string, label: string, url: string }>
})

const editorTab = ref('editor')
const previewHtml = ref('')

// Gérer les textes de loi (tableau d'objets)
const addTexteLoi = () => {
  form.textesLoi.push({ prefix: '', label: '', url: '' })
}

const removeTexteLoi = (index: number) => {
  form.textesLoi.splice(index, 1)
}

// Mettre à jour la prévisualisation
const updatePreview = async () => {
  previewHtml.value = await marked.parse(form.content)
}

// Mettre à jour la prévisualisation quand on change d'onglet
const switchTab = (tab: string) => {
  editorTab.value = tab
  if (tab === 'preview') {
    updatePreview()
  }
}

const handleSubmit = () => {
  form.post('/admin/aides')
}
</script>

<template>
  <Head title="Nouvelle aide | Admin" />

  <DefaultLayout>
    <BrandBackgroundContainer textured contrast>
      <SectionContainer type="page-header">
        <h1 class="brand-contrast-text"><br/>Créer une aide</h1>
      </SectionContainer>
    </BrandBackgroundContainer>

    <BrandBackgroundContainer textured subtle>
      <SectionContainer type="page-block">
        <div class="fr-container fr-container--fluid">
          <div class="fr-grid-row fr-grid-row--gutters">
            <div class="fr-col-12">
              <DsfrBreadcrumb
                :links="[
                  { text: 'Administration', to: '/admin' },
                  { text: 'Aides', to: '/admin/aides' },
                  { text: 'Nouvelle aide', to: '/admin/aides/create' }
                ]"
              />
            </div>
          </div>

          <div>
            <form @submit.prevent="handleSubmit">
              <div class="fr-grid-row fr-grid-row--gutters">
                <div class="fr-col-12">
                  <DsfrInput
                    v-model="form.title"
                    label="Titre"
                    required
                  />
                </div>
              </div>

              <div class="fr-grid-row fr-grid-row--gutters fr-mt-2w">
                <div class="fr-col-12">
                  <DsfrInput
                    v-model="form.description"
                    label="Description"
                    hint="Description courte de l'aide"
                  />
                </div>
              </div>

              <div class="fr-grid-row fr-grid-row--gutters fr-mt-2w">
                <div class="fr-col-12 fr-col-md-4">
                  <DsfrInput
                    v-model="form.type"
                    label="Type"
                    hint="Type d'aide (ex: subvention, crédit d'impôt)"
                  />
                </div>
                <div class="fr-col-12 fr-col-md-4">
                  <DsfrInput
                    v-model="form.usage"
                    label="Usage"
                    hint="Usage de l'aide (ex: rénovation, création d'entreprise)"
                  />
                </div>
                <div class="fr-col-12 fr-col-md-4">
                  <DsfrInput
                    v-model="form.instructeur"
                    label="Instructeur"
                    hint="Organisme instructeur (ex: Région, Département)"
                  />
                </div>
              </div>

              <div class="fr-mt-4w">
                <h3>Textes de loi associés</h3>
                <div v-if="form.textesLoi.length === 0" class="fr-alert fr-alert--info fr-mb-2w">
                  <p>Aucun texte de loi associé</p>
                </div>

                <div v-else v-for="(texteLoi, index) in form.textesLoi" :key="index" class="fr-grid-row fr-grid-row--gutters fr-mb-2w texte-loi-item">
                  <div class="fr-col-12 fr-col-md-2">
                    <DsfrInput
                      v-model="texteLoi.prefix"
                      label="Préfixe"
                      placeholder="Art."
                    />
                  </div>
                  <div class="fr-col-12 fr-col-md-4">
                    <DsfrInput
                      v-model="texteLoi.label"
                      label="Référence"
                      placeholder="L. 123-45 du code..."
                    />
                  </div>
                  <div class="fr-col-12 fr-col-md-5">
                    <DsfrInput
                      v-model="texteLoi.url"
                      label="URL"
                      placeholder="https://www.legifrance.gouv.fr/..."
                    />
                  </div>
                  <div class="fr-col-12 fr-col-md-1 fr-flex fr-flex--center fr-flex--middle remove-button-container">
                    <button type="button" class="fr-btn fr-btn--secondary fr-btn--sm remove-button" @click="removeTexteLoi(index)">
                      <span class="fr-icon-delete-line" aria-hidden="true"></span>
                    </button>
                  </div>
                </div>

                <div class="fr-mt-2w">
                  <DsfrButton
                    type="button"
                    label="Ajouter un texte de loi"
                    secondary
                    icon="fr-icon-add-line"
                    @click="addTexteLoi"
                  />
                </div>
              </div>

              <div class="fr-mt-4w editor-container">
                <div class="editor-tabs">
                  <button
                    type="button"
                    class="tab-button"
                    :class="{ active: editorTab === 'editor' }"
                    @click="switchTab('editor')"
                  >
                    <span class="fr-icon-edit-line" aria-hidden="true"></span>
                    Éditeur
                  </button>
                  <button
                    type="button"
                    class="tab-button"
                    :class="{ active: editorTab === 'preview' }"
                    @click="switchTab('preview')"
                  >
                    <span class="fr-icon-eye-line" aria-hidden="true"></span>
                    Prévisualisation
                  </button>
                </div>

                <div class="editor-content">
                  <textarea
                    v-if="editorTab === 'editor'"
                    v-model="form.content"
                    class="markdown-textarea"
                    placeholder="Contenu détaillé de l'aide en Markdown..."
                    required
                  ></textarea>

                  <div
                    v-else
                    class="markdown-preview fr-p-3w"
                    v-html="previewHtml"
                  ></div>
                </div>
              </div>

              <div class="fr-mt-4w fr-grid-row">
                <div class="fr-col-12 fr-col-md-6 fr-col-offset-md-6 fr-flex fr-flex--right">
                  <DsfrButton
                    type="button"
                    label="Annuler"
                    secondary
                    :href="'/admin/aides'"
                    class="fr-mr-2w"
                  />

                  <DsfrButton
                    type="submit"
                    label="Enregistrer"
                    :disabled="form.processing"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </SectionContainer>
    </BrandBackgroundContainer>
  </DefaultLayout>
</template>

<style scoped>
.editor-container {
  border: 1px solid var(--border-default-grey);
  border-radius: 4px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-default-grey);
  background-color: var(--background-default-grey);
}

.tab-button {
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button.active {
  font-weight: bold;
  border-bottom: 2px solid var(--blue-france-sun-113-625);
  background-color: var(--background-contrast-grey);
}

.tab-button:hover {
  background-color: var(--hover-grey);
}

.editor-content {
  min-height: 400px;
}

.markdown-textarea {
  width: 100%;
  height: 400px;
  border: none;
  padding: 1rem;
  font-family: monospace;
  font-size: 1rem;
  resize: none;
}

.markdown-preview {
  height: 400px;
  overflow: auto;
  background-color: var(--background-alt-grey);
}

.texte-loi-item {
  padding: 1rem;
  background-color: var(--background-contrast-grey);
  border-radius: 4px;
  position: relative;
}

.remove-button-container {
  display: flex;
  align-items: flex-end;
  padding-bottom: 0.5rem;
}

/* CSS pour le contenu Markdown prévisualisé */
:deep(.markdown-preview h1) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-size: 2rem;
}

:deep(.markdown-preview h2) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

:deep(.markdown-preview h3) {
  margin-top: 1rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

:deep(.markdown-preview p) {
  margin-bottom: 1rem;
}

:deep(.markdown-preview ul),
:deep(.markdown-preview ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

:deep(.markdown-preview li) {
  margin-bottom: 0.5rem;
}

:deep(.markdown-preview a) {
  color: var(--text-action-high-blue-france);
  text-decoration: underline;
}

:deep(.markdown-preview blockquote) {
  border-left: 4px solid var(--border-default-grey);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--text-mention-grey);
}
</style>
