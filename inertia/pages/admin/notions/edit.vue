<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3'
import { marked } from 'marked'
import { ref } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'

const props = defineProps<{
  notion: {
    id: number
    title: string
    slug: string
    content: string
    description: string | null
    category: string | null
  }
}>()

const form = useForm({
  title: props.notion.title,
  content: props.notion.content,
  description: props.notion.description || '',
  category: props.notion.category || '',
})

const editorTab = ref('editor')
const previewHtml = ref('')

// Mettre à jour la prévisualisation
async function updatePreview() {
  previewHtml.value = await marked.parse(form.content)
}

// Mettre à jour la prévisualisation quand on change d'onglet
function switchTab(tab: string) {
  editorTab.value = tab
  if (tab === 'preview') {
    updatePreview()
  }
}

function handleSubmit() {
  form.post(`/admin/notions/${props.notion.id}`)
}
</script>

<template>
  <Head :title="`Modifier - ${notion.title} | Admin`" />

  <BrandBackgroundContainer
    textured
    contrast
  >
    <SectionContainer type="page-header">
      <h1 class="brand-contrast-text">
        <br>Modifier la notion
      </h1>
    </SectionContainer>
  </BrandBackgroundContainer>

  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-block">
      <div class="fr-container fr-container--fluid">
        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12">
            <DsfrBreadcrumb
              :links="[
                { text: 'Administration', to: '/admin' },
                { text: 'Notions', to: '/admin/notions' },
                { text: `Modifier - ${notion.title}`, to: `/admin/notions/${notion.id}/edit` },
              ]"
            />
          </div>
        </div>

        <div class="">
          <form @submit.prevent="handleSubmit">
            <div class="fr-grid-row fr-grid-row--gutters">
              <div class="fr-col-12 fr-col-md-8">
                <label class="fr-label">Titre</label>
                <DsfrInput
                  v-model="form.title"
                  required
                />
              </div>

              <div class="fr-col-12 fr-col-md-4">
                <div class="fr-input-group">
                  <label class="fr-label">Slug</label>
                  <div class="fr-input">
                    {{ notion.slug }}
                  </div>
                  <p class="fr-hint-text">
                    Le slug est généré automatiquement à partir du titre initial
                  </p>
                </div>
              </div>
            </div>

            <div class="fr-grid-row fr-grid-row--gutters fr-mt-2w">
              <div class="fr-col-12">
                <label class="fr-label">Description</label>
                <DsfrInput
                  v-model="form.description"
                  hint="Brève description de la notion (facultatif)"
                />
              </div>
            </div>

            <div class="fr-grid-row fr-grid-row--gutters fr-mt-2w">
              <div class="fr-col-12">
                <label class="fr-label">Catégorie</label>
                <DsfrInput
                  v-model="form.category"
                  hint="Catégorie de la notion (facultatif)"
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
                  <span
                    class="fr-icon-edit-line"
                    aria-hidden="true"
                  />
                  Éditeur
                </button>
                <button
                  type="button"
                  class="tab-button"
                  :class="{ active: editorTab === 'preview' }"
                  @click="switchTab('preview')"
                >
                  <span
                    class="fr-icon-eye-line"
                    aria-hidden="true"
                  />
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
                />

                <div
                  v-else
                  class="markdown-preview fr-p-3w"
                  v-html="previewHtml"
                />
              </div>
            </div>

            <div class="fr-mt-4w fr-grid-row">
              <div class="fr-col-12 fr-col-md-6 fr-col-offset-md-6 fr-flex fr-flex--right">
                <DsfrButton
                  type="button"
                  label="Annuler"
                  secondary
                  href="/admin/notions"
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
