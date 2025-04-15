<!-- inertia/pages/admin/pages/create.vue -->
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
  metaDescription: ''
})

const editorTab = ref('editor')
const previewHtml = ref('')

// Mettre à jour la prévisualisation
const updatePreview = async () => {
  try {
    const result = await marked(form.content)
    previewHtml.value = result.toString()
  } catch (error) {
    previewHtml.value = 'Erreur lors de la prévisualisation'
  }
}

// Mettre à jour la prévisualisation quand on change d'onglet
const switchTab = (tab: string) => {
  editorTab.value = tab
  if (tab === 'preview') {
    updatePreview()
  }
}

const handleSubmit = () => {
  form.post('/admin/pages')
}
</script>

<template>
  <Head title="Créer une page | Admin" />

  <DefaultLayout>
    <BrandBackgroundContainer textured contrast>
      <SectionContainer type="page-header">
        <h1 class="brand-contrast-text"><br>Créer une page</h1>
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
                  { text: 'Pages', to: '/admin/pages' },
                  { text: 'Créer une page', to: '/admin/pages/create' }
                ]"
              />
            </div>
          </div>

          <div class="fr-mt-4w">
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
                    v-model="form.metaDescription"
                    label="Description (meta)"
                    hint="Description courte pour les moteurs de recherche"
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
                    placeholder="Contenu Markdown..."
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
                    :href="'/admin/pages'"
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
</style>
