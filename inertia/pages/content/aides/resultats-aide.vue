<script lang="ts" setup>
import type AideController from '#controllers/content/aide_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import DemarchesSimplifiedButton from '~/components/aides/DemarchesSimplifiedButton.vue'
import DsfrLink from '~/components/DsfrLink.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aide,
    simulateur,
    hash,
    html,
  },
} = usePage<InferPageProps<AideController, 'showWithResults'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Aides', to: '/aides' },
  { text: aide.title, to: `/aides/${aide.slug}` },
])
</script>

<template>
  <Head
    :title="aide.title"
    :description="aide.metaDescription ?? aide.description ?? ''"
  />
  <article class="brand-html-content">
    <header class="fr-mb-6w">
      <h1>
        {{ aide.title }}
      </h1>
      <DsfrLink
        icon-before
        label="Revenir à mes résultats"
        :to="`/simulateurs/${simulateur.slug}/resultats/${hash}#simulateur-title`"
        :icon="{ name: 'ri:arrow-left-line', ssr: true }"
      />
    </header>

    <!-- Démarches Simplifiées integration -->
    <DemarchesSimplifiedButton
      v-if="aide.dsEnabled"
      :aide-slug="aide.slug"
      :submission-hash="hash"
      :ds-enabled="aide.dsEnabled"
      :ds-demarche-id="aide.dsDemarcheId"
    />

    <div class="fr-card fr-p-3w">
      <div v-html="html" />
    </div>
  </article>
</template>

<style scoped lang="scss">
:deep(th) {
  text-align: left !important;
}

:deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

:deep(thead) {
  border-bottom: 2px solid var(--border-default-grey);
}

:deep(tbody tr) {
  border-bottom: 1px solid var(--border-default-grey);

  &:last-child {
    border-bottom: none;
  }
}

:deep(th),
:deep(td) {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-default-grey);
}
</style>
