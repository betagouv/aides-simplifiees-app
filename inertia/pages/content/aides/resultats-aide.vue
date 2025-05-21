<script lang="ts" setup>
import type DynamicContentController from '#controllers/dynamic_content_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/vue3'
import DsfrLink from '~/components/DsfrLink.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const {
  props: {
    aide,
    simulateur,
    hash,
    html,
  },
} = usePage<InferPageProps<DynamicContentController, 'renderResultatsAide'>>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Aides', to: '/aides' },
  { text: aide.title, to: `/aides/${aide.slug}` },
])
</script>

<template>
  <Head
    :title="`Aide '${aide.title}'`"
    :description="
      aide.description
        || `Découvrez toutes les informations sur l'aide '${aide.title}' pour vous accompagner dans vos démarches.`
    "
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
