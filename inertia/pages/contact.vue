<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})
const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Contact', to: '/contact' },
])
useSeoMeta({
  title: 'Nous contacter pour toute question sur vos droits | Aides simplifiées',
  description: 'Besoin d\'aide pour utiliser nos simulateurs ou comprendre vos résultats ? Notre équipe est à votre disposition pour vous accompagner dans vos démarches.'
})
</script>

<template>
  <BrandBackgroundContainer
    textured
    subtle
  >
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-full">
      <div class="fr-grid-row fr-grid-row--gutters">
        <div class="fr-col-12">
          <h1>
            Contactez-nous
          </h1>
          <p class="fr-text--lg">
            Nous facilitons l’accès aux aides en vous proposant les services les plus simples et clairs possibles.
            <br>
            Besoin d’informations ou d’assistance ? Nous sommes là pour vous aider.
          </p>
          <p class="fr-text--lg">
            Écrivez-nous à <strong>aides.simplifiees@numerique.gouv.fr</strong>
          </p>
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
