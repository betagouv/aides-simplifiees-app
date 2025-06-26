<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import AdminPageHeading from '~/components/layout/AdminPageHeading.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import PartenairesSection from '~/components/PartenairesSection.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import PartenairesSection from '~/components/PartenairesSection.vue'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Partenaires', to: '/partenaires' },
])
</script>

<template>
  <Head
    title="Devenir partenaire"
    description="Facilitez l'accès aux aides sur votre territoire. Optimisez le parcours usager du simulateur au dépôt de dossier et améliorez l'efficacité de vos dispositifs d'aide."
  />
  <AdminPageHeading
    highlighted-title="Vous êtes une administration&nbsp;:"
    title="le parcours d'accès aux aides"
  />
  <SectionContainer type="page-block">
    <div>
      <p class="fr-text--lg">
        Les administrations et organismes publics jouent un rôle clé dans l'accès aux aides. En
        travaillant avec nous, vous :
      </p>
      <ul class="fr-text--lg fr-mt-n2w fr-mb-2w">
        <li>
          Facilitez le parcours d'accès aux aides sur votre territoire ou votre domaine de
          compétences.
        </li>
        <li>Accompagnez les usagers du diagnostic au dépôt de dossier.</li>
        <li>
          Intégrez des simulateurs fiables et à jour, incluant les aides dont vous êtes
          responsable, sans développement complexe.
        </li>
      </ul>
      <p class="fr-text--lg">
        Nous collaborons avec des acteurs engagés pour une administration plus simple et plus
        accessible.<br>
        Intéressé ? Discutons ensemble de la meilleure manière d'intégrer aides simplifiées à
        votre service :contactez-nous à aides.simplifiees@numerique.gouv.fr.
        <br>
        <br>
        Contacter notre équipe à l'adresse
        <a href="mailto:aides.simplifiees@numerique.gouv.fr">aides.simplifiees@numerique.gouv.fr</a>.
      </p>
    </div>
  </SectionContainer>
  <SectionContainer type="page-footer">
    <PartenairesSection />
  </SectionContainer>
</template>
