<script setup lang="ts">
import { DsfrButtonGroup, DsfrInputGroup, DsfrSelect } from '@gouvminint/vue-dsfr'
import { Head, router, useForm } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const form = useForm({
  title: '',
  slug: '',
  description: '',
  shortTitle: '',
  pictogramPath: '',
  status: 'draft',
})

function handleSubmit() {
  form.post(`/admin/simulateurs`)
}

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Administration', to: '/admin' },
  { text: 'Simulateurs', to: '/admin/simulateurs' },
  { text: `Créer un simulateur`, to: '/admin/simulateurs/create' },
])
</script>

<template>
  <Head title="Créer un simulateur | Admin" />

  <BrandBackgroundContainer
    textured
    contrast
  >
    <BreadcrumbSectionContainer contrast />
    <SectionContainer type="page-header">
      <h1 class="brand-contrast-text">
        Créer un simulateur
      </h1>
    </SectionContainer>
  </BrandBackgroundContainer>

  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer type="page-block">
      <form @submit.prevent="handleSubmit">
        <DsfrInputGroup
          v-model="form.title"
          label="Titre"
          label-visible
          required
          hint="Titre complet du simulateur"
        />
        <DsfrInputGroup
          v-model="form.slug"
          label="Slug"
          required
          label-visible
          hint="Identifiant unique du simulateur (ex: simulateur-logement)"
        />
        <DsfrInputGroup
          v-model="form.description"
          label="Description"
          label-visible
          hint="Description du simulateur"
        />
        <DsfrInputGroup
          v-model="form.shortTitle"
          label="Titre court"
          label-visible
          hint="Version courte du titre (pour les espaces restreints)"
        />
        <DsfrInputGroup
          v-model="form.pictogramPath"
          label="Chemin du pictogramme"
          label-visible
          hint="Chemin relatif vers le pictogramme (ex: /img/pictograms/logement.svg)"
        />
        <DsfrSelect
          v-model="form.status"
          label="Statut"
          :options="[
            { value: 'draft', text: 'Brouillon' },
            { value: 'published', text: 'Publié' },
          ]"
          required
        />

        <div class="fr-mt-4w fr-grid-row fr-grid-row--right">
          <DsfrButtonGroup
            equisized
            size="lg"
            inline-layout-when="always"
            :buttons="[
              {
                label: 'Annuler',
                secondary: true,
                onClick: () => router.visit(`/admin/simulateurs`),
                icon: { name: 'ri:arrow-left-line', ssr: true },
                class: 'fr-mr-2w',
              },
              {
                label: 'Enregistrer',
                icon: { name: 'ri:save-line', ssr: true },
                type: 'submit',
                iconRight: true,
                disabled: form.processing,
              },
            ]"
          />
        </div>
      </form>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
