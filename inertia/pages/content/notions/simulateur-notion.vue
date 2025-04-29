<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import DsfrLink from '~/components/DsfrLink.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

// Define props based on ContentController.showNotion
const props = defineProps<{
  simulateur: {
    id: string
    slug: string
    title: string
  }
  notion: {
    id: string
    slug: string
    title: string
    description: string
    content: string
  }
  html: string
}>()

const { setBreadcrumbs } = useBreadcrumbStore()

setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Notions', to: '/notions' },
  { text: props.simulateur.title, to: `/simulateurs/${props.simulateur.slug}#simulateur-title` },
  { text: props.notion.title, to: `/simulateurs/${props.simulateur.slug}/${props.notion.slug}#simulateur-title` },
])
</script>

<template>
  <Head
    :title="`Informations sur la notion '${notion.title}'`"
    :description="notion.description
      || `Découvrez toutes les informations sur la notion '${notion.title}' pour vous accompagner dans vos démarches.`
    "
  />
  <article
    v-if="simulateur && notion"
    class="brand-html-content"
  >
    <header class="fr-mb-6w">
      <h1>
        {{ notion.title }}
      </h1>
      <DsfrLink
        icon-before
        preserve-scroll
        label="Revenir à ma simulation"
        :to="`/simulateurs/${simulateur.slug}`"
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

/* Adjustments for dark mode, if your app supports it */
.dark-mode :deep(thead),
.dark-mode :deep(th),
.dark-mode :deep(td),
.dark-mode :deep(tbody tr) {
  border-color: var(--border-default-grey-dark, #666);
}
</style>
