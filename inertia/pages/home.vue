<script setup lang="ts">
  import { Head } from '@inertiajs/vue3'
  import { DsfrAlert, DsfrTile, DsfrTiles, DsfrCard } from '@gouvminint/vue-dsfr'
  import type { DsfrTileProps } from '@gouvminint/vue-dsfr'
  import DefaultLayout from '../layouts/default.vue'

  const baselineTitle = 'Trouvez les aides&nbsp;adaptées à&nbsp;votre&nbsp;situation'
  const baselineSubtitle = 'Un service simple et rapide pour savoir à quelles aides vous avez droit.'

  const simulationTiles: DsfrTileProps[] = [
    {
      title: 'Déménagement & logement',
      to: '/simulateurs/demenagement-logement',
      titleTag: 'h2',
      svgPath: '/artworks/custom-pictograms/demenagement.svg'
    },
    {
      title: 'Rénovation du logement',
      titleTag: 'h2',
      to: 'https://mesaidesreno.beta.gouv.fr/',
      svgPath: '/artworks/pictograms/buildings/house.svg'
    }
  ]
</script>

<template>
  <Head title="La bonne aide, au bon moment, au bon endroit" />
  <DefaultLayout>
    <div class="brand-background-container brand-background-container--textured brand-background-container--blue">
      <div class="fr-container">
        <div class="brand-home-banner fr-grid-row fr-grid-row--gutters">
          <div class="brand-home-banner__column fr-col-12 fr-col-lg-6">
            <h1
              class="brand-site-title brand-title-gradient"
              v-html="baselineTitle"
            />
            <p class="fr-text--xl brand-home-banner__baseline">
              {{ baselineSubtitle }}
            </p>
          </div>
          <div class="brand-home-banner__column fr-col-12 fr-col-md-6 fr-col-offset-xl-1 fr-col-xl-5">
            <DsfrTiles
              :tiles="simulationTiles"
              horizontal
              title-tag="h2"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="brand-background-container brand-background-container--textured brand-background-container--subtle">
      <div class="fr-container">
        <h2 class="fr-title">
          Pour aller plus loin, utilisez ces simulateurs pour évaluer tous vos droits
        </h2>
        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12 fr-col-md-6">
            <DsfrCard
              horizontal
              title="1jeune1solution.gouv.fr"
              description="Simulateur tout public avec de nombreuses aides pour les moins de 30 ans. Évaluez vos droits à plus de 1000 aides."
              link="https://www.1jeune1solution.gouv.fr/mes-aides"
              title-tag="h3"
            />
          </div>
          <div class="fr-col-12 fr-col-md-6">
            <DsfrCard
              horizontal
              title="mesdroitsociaux.gouv.fr"
              description="Simulateur tout public. Évaluez vos droits à près de 60 aides."
              link="https://www.mesdroitssociaux.gouv.fr/"
              title-tag="h3"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="brand-background-container brand-background-container--textured brand-background-container--contrast">
      <div class="fr-container">
        <hgroup class="fr-mb-6w">
          <h2 class="fr-display--xs brand-contrast-text">
            <span class="brand-contrast-text--highlight">
              Vous souhaitez améliorer l'accès aux aides ?
            </span><br>Aides simplifiées vous accompagne !
          </h2>
          <p class="fr-text--xl brand-contrast-text">
            Aides simplifiées permet aux citoyens de trouver facilement les aides auxquelles ils sont éligibles et de
            simplifier leur parcours administratif. Nous collaborons avec des acteurs publics et des plateformes en ligne
            pour intégrer notre service et fluidifier l'accès aux dispositifs existants.
          </p>
        </hgroup>
        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12 fr-col-md-6">
            <DsfrTile
              title="Vous êtes une administration ou vous opérez un service public&nbsp;?"
              description="Facilitez l'accès aux aides sur votre territoire ou sur votre domaine de compétence et optimisez le passage de la simulation au dépôt de dossier."
              title-tag="h3"
              to="/partenaires"
              horizontal
              svg-path="/artworks/pictograms/buildings/city-hall.svg"
            />
          </div>
          <div class="fr-col-12 fr-col-md-6">
            <DsfrTile
              title="Vous êtes une plateforme en ligne&nbsp;?"
              description="Offrez à vos usagers un accès simple et fiable aux aides pertinentes pour eux en intégrant nos simulateurs en quelques minutes via API ou iFrame."
              title-tag="h3"
              to="/integrer-nos-simulateurs"
              horizontal
              svg-path="/artworks/pictograms/digital/internet.svg"
            />
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped lang="scss">
.brand-background-container {
  padding: 2rem 0;

  &--textured {
    background-image: url("/assets/images/texture.png");
    background-repeat: repeat;
  }

  &--blue {
    background-color: var(--blue-france-975-100);
  }

  &--subtle {
    background-color: var(--grey-975-75);
  }

  &--contrast {
    background-color: var(--blue-france-925-100);
    color: white;
  }
}

.brand-home-banner {
  padding: 2rem 0;

  .brand-home-banner__column {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .brand-site-title {
    font-size: 2.5rem;
    line-height: 3rem;
    margin-bottom: 1rem;

    @media (min-width: 36em) {
      font-size: 3.5rem !important;
      line-height: 4rem !important;
    }

    @media (min-width: 48em) {
      font-size: 4rem !important;
      line-height: 4.5rem !important;
    }
  }

  & p.brand-home-banner__baseline {
    margin-bottom: 2rem;

    @media (min-width: 48em) {
      font-size: 1.8rem !important;
      line-height: 1.4 !important;
    }
  }
}

.brand-title-gradient {
  background: linear-gradient(90deg, var(--blue-france-sun-113-625) 0%, var(--blue-france-sun-113-625-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}

.brand-contrast-text {
  color: white;

  &--highlight {
    background-color: white;
    color: var(--blue-france-925-100);
    padding: 0 0.5rem;
  }
}

.fr-mb-6w {
  margin-bottom: 3rem;
}
</style>
