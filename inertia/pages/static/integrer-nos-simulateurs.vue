<script lang="ts" setup>
import type { SharedProps } from '@adonisjs/inertia/types'
import { DsfrAccordion, DsfrAccordionsGroup, DsfrCallout, DsfrSelect, DsfrTable } from '@gouvminint/vue-dsfr'
import { Head, usePage } from '@inertiajs/vue3'
import { computed, onMounted, ref, watch } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import BreadcrumbSectionContainer from '~/components/layout/BreadcrumbSectionContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Intégrer nos simulateurs', to: '/integrer-nos-simulateurs' },
])

// Choix du simulateur
const simulateurs = ref([
  { label: 'Déménagement & logement', value: 'demenagement-logement' },
])
const selectedSimulateur = ref('demenagement-logement')

const page = usePage<SharedProps>()
const origin = page.props.publicAppUrl
const sriHash = page.props.iframeSriHash as string
const iframeVersion = page.props.iframeVersion as string

// Inclusion du script avec URL versionnée
const scriptPath = `/assets/iframe-integration@${iframeVersion}.js`
const fullScript = computed(() => {
  let script = `<script src="${origin}${scriptPath}"`

  script += ` data-simulateur="${selectedSimulateur.value}"`
  script += ` integrity="${sriHash}"`
  script += ` crossorigin="anonymous"`

  script += ` defer><\/script>`
  return script
})

// Fonction pour mettre à jour l'aperçu de l'iframe
const iframeContainer = ref<HTMLElement | null>(null)
function setIframeContainer(): void {
  if (!iframeContainer.value) {
    return
  }
  // Nettoyer le conteneur
  iframeContainer.value.innerHTML = ''
  // Créer et ajouter le script d'intégration
  const script = document.createElement('script')
  script.src = `${origin}${scriptPath}`
  script.dataset.simulateur = selectedSimulateur.value
  script.integrity = sriHash
  script.crossOrigin = 'anonymous'
  iframeContainer.value.appendChild(script)
}

onMounted(() => {
  // Surveiller les changements d'options et mettre à jour la prévisualisation
  watch(selectedSimulateur, () => {
    setIframeContainer()
  }, { immediate: true })
})

const activeAccordion = ref<number>()

const listenerExamples = `
// Écoutez l'événement 'aides-simplifiees-ready' pour savoir quand l'iframe est prête
window.addEventListener('aides-simplifiees-ready', function() {
  console.log('Le simulateur est prêt');
  });
// Écoutez l'événement 'aides-simplifiees-message' pour recevoir les messages de l'iframe
window.addEventListener('aides-simplifiees-message', function(event) {
  console.log('Message reçu:', event.detail);
});`
</script>

<template>
  <Head
    title="Intégrer nos simulateurs d\'aides sur votre plateforme"
    description="Offrez à vos usagers un accès simple aux aides pertinentes en intégrant nos simulateurs via API ou iFrame. Solution clé en main, rapide à mettre en place."
  />
  <BrandBackgroundContainer
    textured
    contrast
  >
    <BreadcrumbSectionContainer contrast />
    <SectionContainer
      type="page-header"
    >
      <h1 class="brand-contrast-text">
        <span class="brand-contrast-text--highlight">
          Vous opérez une plateforme numérique&nbsp;:
        </span><br>intégrez un de nos simulateurs
      </h1>
    </SectionContainer>
  </BrandBackgroundContainer>
  <BrandBackgroundContainer
    textured
    subtle
  >
    <SectionContainer
      type="page-footer"
    >
      <hgroup>
        <h2>
          Vous avez un site qui informe ou accompagne les usagers ?
        </h2>
        <p class="fr-text--lg">
          Intégrez facilement nos simulateurs pour offrir à votre audience un accès immédiat aux aides disponibles.
        </p>
      </hgroup>
      <hgroup class="fr-mt-8w">
        <h3>
          Deux options d'intégration
        </h3>
        <ul class="fr-text--lg">
          <li>
            iFrame : Intégration simple et rapide sur votre site web.
          </li>
          <li>
            API : Personnalisation avancée
          </li>
        </ul>
      </hgroup>
      <div :style="{ maxWidth: '48em' }">
        <DsfrAccordionsGroup
          v-model="activeAccordion"
        >
          <DsfrAccordion
            id="accordion-1"
            title="Intégrez le simulateur sur votre site par une iframe"
          >
            <p>Notre simulateur d'aides est intégrable de manière transparente en ajoutant une simple ligne de code à votre page web.</p>
            <p>
              Le script d'intégration est accessible
              <a
                href="https://github.com/betagouv/aides-simulateur-front/blob/main/client/public/iframe-integration.js"
                target="_blank"
              >sur le dépôt hébergeant notre code</a>.
            </p>

            <h3>
              Code d'intégration
            </h3>
            <p>Voici le script à intégrer sur votre site, qui créera l'iframe adéquate et l'ajoutera à votre page :</p>
            <DsfrSelect
              v-model="selectedSimulateur"
              label="Sélectionnez le simulateur à intégrer"
              :options="simulateurs.map((simulateur) => ({
                text: simulateur.label,
                value: simulateur.value,
              }))"
            />
            <DsfrCallout>
              <code class="fr-text--sm">{{ fullScript }}</code>
            </DsfrCallout>

            <h3 class="fr-mt-4w">
              Prévisualisation
            </h3>
            <div class="fr-p-2w fr-background-alt--grey">
              <p>
                Voici un aperçu de l'intégration du simulateur sur votre site :
              </p>
              <div
                id="aides-simplifiees-iframe-container"
                ref="iframeContainer"
              />
            </div>

            <div class="fr-my-8w">
              <h3>Options d'intégration</h3>
              <p>
                Vous pouvez personnaliser l'intégration en modifiant les attributs suivantes dans le tag <code>&lt;script&gt;</code> :
              </p>
              <DsfrTable
                caption-position="none"
                title="Options d'intégration"
              >
                <thead>
                  <tr>
                    <th scope="col">
                      Attribut
                    </th>
                    <th scope="col">
                      Description
                    </th>
                    <th scope="col">
                      Est obligatoire ?
                    </th>
                    <th scope="col">
                      Valeur par défaut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>data-simulateur</code></td>
                    <td>Identifiant du simulateur à afficher</td>
                    <td>Oui</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td><code>data-height</code></td>
                    <td>Hauteur initiale de l'iframe</td>
                    <td>Non</td>
                    <td><code>600px</code></td>
                  </tr>
                  <tr>
                    <td><code>data-log</code></td>
                    <td>Active les logs de débogage</td>
                    <td>Non</td>
                    <td><code>false</code></td>
                  </tr>
                  <tr>
                    <td><code>data-wait-for-load</code></td>
                    <td>Attendre le chargement complet avant redimensionnement</td>
                    <td>Non</td>
                    <td><code>true</code></td>
                  </tr>
                </tbody>
              </DsfrTable>

              <h4 class="fr-mt-4w">
                Sécurité : Subresource Integrity (SRI)
              </h4>
              <p>
                Le code d'intégration inclut automatiquement la sécurité SRI (Subresource Integrity) qui garantit que le script n'a pas été modifié.
                Cette protection vérifie l'intégrité du fichier JavaScript avant son exécution.
              </p>
              <p>
                <strong>Hash SRI actuel :</strong> <code class="fr-text--sm">{{ sriHash }}</code>
              </p>
              <p>
                Les attributs <code>integrity</code> et <code>crossorigin="anonymous"</code> sont automatiquement inclus dans le code d'intégration pour assurer cette sécurité.
              </p>

              <h4 class="fr-mt-4w">
                Événements JavaScript
              </h4>
              <p>Le script d'intégration émet des événements JavaScript que vous pouvez écouter pour interagir avec le simulateur :</p>

              <DsfrCallout>
                <pre
                  class="fr-text--sm"
                  style="white-space: pre-wrap;"
                >
            {{ listenerExamples }}
            </pre>
              </DsfrCallout>
            </div>

            <div class="fr-my-8w">
              <h3>Personnalisation avancée</h3>
              <p>
                Si vous souhaitez une intégration personnalisée du simulateur, vous pouvez
                contacter notre équipe à l'adresse
                <a href="mailto:aides.simplifiees@numerique.gouv.fr">aides.simplifiees@numerique.gouv.fr</a>.
              </p>
            </div>
          </DsfrAccordion>
          <DsfrAccordion
            id="accordion-2"
            title="Intégrez le simulateur sur votre site par une API"
          >
            <p>
              L'intégration par API vous permet de personnaliser l'expérience utilisateur et de bénéficier de fonctionnalités avancées.
            </p>
            <p>
              Pour plus d'informations, contactez notre équipe à l'adresse
              <a href="mailto:aides.simplifiees@numerique.gouv.fr">aides.simplifiees@numerique.gouv.fr</a>.
            </p>
          </DsfrAccordion>
        </DsfrAccordionsGroup>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
