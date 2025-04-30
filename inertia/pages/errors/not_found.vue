<script lang="ts" setup>
import { Head } from '@inertiajs/vue3'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const props = defineProps({
  error: Object,
})

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Page introuvable', to: '' },
])

// Default to 404 settings
const statusCode = props.error?.statusCode || 404
let title = 'Page non trouvée'
let statusText = 'Erreur 404'
let message = 'La page que vous cherchez est introuvable. Excusez-nous pour la gène occasionnée.'
const part1 = 'Si vous avez tapé l\'adresse web dans le navigateur, vérifiez qu\'elle est correcte. La page n\'est peut-être plus disponible.'
const part2 = 'Dans ce cas, pour continuer votre visite vous pouvez consulter notre page d\'accueil, ou effectuer une recherche avec notre moteur de recherche en haut de page.'
const part3 = 'Sinon contactez-nous pour que l\'on puisse vous rediriger vers la bonne information.'
let description = `${part1}\n${part2}\n${part3}`

// Set specific title and message based on error status if available
if (statusCode === 500) {
  title = 'Erreur inattendue'
  statusText = 'Erreur 500'
  message = 'Essayez de rafraîchir la page ou bien réessayez plus tard.'
  description = 'Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement possible.'
}
else if (statusCode !== 404) {
  title = 'Service indisponible'
  statusText = `Erreur ${statusCode}`
  message = 'Le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement possible.'
  description = 'Merci de réessayer plus tard ou de contacter le support.'
}
</script>

<template>
  <Head
    :title="title"
    description="Nous vous prions de nous excuser pour ce désagrément."
  />

  <BrandBackgroundContainer
    textured
    subtle
  >
    <BreadcrumbSectionContainer />
    <SectionContainer type="page-full">
      <div class="fr-grid-row fr-grid-row--gutters">
        <div class="fr-col-12 fr-col-md-8">
          <h1>{{ title }}</h1>
          <p
            v-if="statusText"
            class="fr-text--sm fr-mb-3w"
          >
            {{ statusText }}
          </p>
          <p
            class="fr-text--lg fr-mb-3w"
          >
            {{ message }}
          </p>
          <p
            class="fr-text--sm fr-mb-5w"
            style="white-space: break-spaces;"
          >
            {{ description }}
          </p>

          <h2 class="fr-h2">
            Message d'erreur
          </h2>
          <div
            v-if="props.error?.message"
            class="fr-callout fr-mt-5w"
          >
            <p
              class="fr-callout__text"
            >
              {{ props.error.message }}
            </p>
          </div>

          <div class="fr-btns-group fr-btns-group--inline-md fr-mt-5w">
            <a
              href="/"
              class="fr-btn"
            >
              Page d'accueil
            </a>
            <a
              href="/contact"
              class="fr-btn fr-btn--secondary"
            >
              Contactez-nous
            </a>
          </div>
        </div>

        <div class="fr-col-12 fr-col-md-4">
          <div class="fr-py-0 fr-py-md-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="fr-responsive-img fr-artwork"
              aria-hidden="true"
              width="160"
              height="200"
              viewBox="0 0 160 200"
            >
              <use
                class="fr-artwork-motif"
                href="/public/artworks/ovoid.svg#artwork-motif"
              />
              <use
                class="fr-artwork-background"
                href="/public/artworks/ovoid.svg#artwork-background"
              />
              <g transform="translate(40, 60)">
                <use
                  class="fr-artwork-decorative"
                  href="/public/artworks/technical-error.svg#artwork-decorative"
                />
                <use
                  class="fr-artwork-minor"
                  href="/public/artworks/technical-error.svg#artwork-minor"
                />
                <use
                  class="fr-artwork-major"
                  href="/public/artworks/technical-error.svg#artwork-major"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
