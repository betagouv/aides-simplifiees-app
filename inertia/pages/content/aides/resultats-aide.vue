<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import DsfrLink from '~/components/DsfrLink.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const props = defineProps<{
  hash: string
  simulateur: {
    id: string
    slug: string
    title: string
  }
  aide: {
    id: number
    title: string
    slug: string
    type: string
    usage: string
    instructeur: string
    description: string
    content: string
    textesLoi?: Array<{ prefix: string, label: string, url: string }>
  }
  html: string
}>()

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Aides', to: '/aides' },
  { text: props.aide.title, to: `/aides/${props.aide.slug}` },
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
  <article>
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
    <!-- Display textes de loi if available -->
    <div
      v-if="aide.textesLoi && aide.textesLoi.length > 0"
      class="fr-mt-4w"
    >
      <h2>Textes de loi associés</h2>
      <ul>
        <li
          v-for="(texte, index) in aide.textesLoi"
          :key="index"
        >
          <a
            :href="texte.url"
            target="_blank"
            rel="noopener"
          >
            {{ texte.prefix }} {{ texte.label }}
          </a>
        </li>
      </ul>
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
