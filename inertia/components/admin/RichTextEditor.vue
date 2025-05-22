<script setup lang="ts">
import { DsfrSegmentedSet } from '@gouvminint/vue-dsfr'
import { marked } from 'marked'
import { ref, watch } from 'vue'

const model = defineModel<string>()
const previewHtml = ref('')

const selectedTab = ref('editor')
watch(selectedTab, async (tab) => {
  if (tab === 'preview') {
    try {
      if (model.value) {
        const result = await marked(model.value)
        previewHtml.value = result.toString()
      }
    }
    catch (error) {
      previewHtml.value = 'Erreur lors de la prévisualisation'
      console.error('Erreur lors de la prévisualisation:', error)
    }
  }
})
</script>

<template>
  <div class="fr-input-group">
    <label
      class="fr-label fr-mb-2w"
      for="md-editor-textarea"
    >
      Contenu
      <span
        class="fr-hint-text"
        data-v-7ca45de8=""
      >Saisissez le contenu de la page en Markdown</span>
    </label>
    <div class="md-editor fr-input fr-p-2w">
      <div class="md-editor__tabs fr-mb-2w">
        <DsfrSegmentedSet
          v-model="selectedTab"
          class="fr-background-default--grey"
          style="display: inline-block;"
          :options="[
            {
              label: 'Éditeur',
              value: 'editor',
              icon: { name: 'ri:edit-line', ssr: true },
            },
            {
              label: 'Aperçu',
              value: 'preview',
              icon: { name: 'ri:eye-line', ssr: true },
            },
          ]"
        />
      </div>
      <div class="md-editor__content fr-card fr-background-default--grey">
        <textarea
          v-if="selectedTab === 'editor'"
          id="md-editor-textarea"
          v-model="model"
          required
          class="md-editor__textarea fr-p-2w"
          placeholder="Contenu de la page en Markdown..."
        />
        <div
          v-else-if="selectedTab === 'preview'"
          class="md-editor__preview fr-p-2w"
          v-html="previewHtml"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.md-editor {
  max-height: none;
}
.md-editor__textarea {
  height: min(400px, 60vh);
  font-family: monospace;
  font-size: 1rem;
  resize: none;
}

.md-editor__preview {
  height: min(400px, 60vh);
  overflow: auto;
}
</style>
