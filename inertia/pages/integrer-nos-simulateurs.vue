<script lang="ts" setup>
const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Intégrer nos simulateurs', to: '/integrer-nos-simulateurs' },
])

useSeoMeta({
  title: 'Intégrer nos simulateurs d\'aides sur votre plateforme | Aides simplifiées',
  description: 'Offrez à vos usagers un accès simple aux aides pertinentes en intégrant nos simulateurs via API ou iFrame. Solution clé en main, rapide à mettre en place.'
})

// Choix des options d'affichage (inutilisé pour le moment)
const displayOptions = ref([
  { label: 'En tête seulement', value: 'header-only' },
  { label: 'Sans tête', value: 'no-header' },
  { label: 'Tête et pied de page', value: 'header-footer' }
])
const selectedDisplayOption = ref('no-header')

// Choix du simulateur (inutilisé pour le moment)
const simulators = ref([
  { label: 'Simulateur APL', value: 'demenagement-logement' },
  { label: 'Simulateur Etudiant', value: 'simulation-globale' }
])
const selectedSimulator = ref('demenagement-logement')

// Inclusion du script
const scriptPath = '/iframe-integration.js'
const fullScript = computed(() => {
  return `<script src="${window?.location.origin}${scriptPath}" defer><\/script>`
})

// Récupérer la référence de la div
const divReference = computed(() => {
  return `<div id='aides-simplifiees-iframe-container'></div>`
})

// Fonction pour mettre à jour l'aperçu de l'iframe
function setIframeContainer (_selectedDisplayOption: string, _selectedSimulator: string): void {
  const dest = document.getElementById('aides-simplifiees-iframe-container')
  if (!dest) { return }

  // Nettoyer le conteneur
  dest.innerHTML = ''

  // Créer et ajouter le script d'intégration plutôt que l'iframe directement
  const script = document.createElement('script')
  script.src = `${window?.location.origin}/iframe-integration.js`

  // Inutilisé pour le moment
  // script.dataset.displayOption = _selectedDisplayOption
  // script.dataset.simulator = _selectedSimulator

  // Ajouter le script au conteneur
  dest.appendChild(script)
}

// Inutilisé pour le moment : surveiller les changements d'options et de thème
watch([selectedDisplayOption, selectedSimulator], () => {
  setIframeContainer(selectedDisplayOption.value, selectedSimulator.value)
})

onMounted(() => {
  setIframeContainer(selectedDisplayOption.value, selectedSimulator.value)
})

const activeAccordion = ref<number>()
</script>

<template>
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
          Deux options d’intégration
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
        <DsfrAccordionGroup
          :expanded-id="activeAccordion"
        >
          <DsfrAccordion
            id="accordion-1"
            title="Intégrez le simulateur sur votre site par une iframe"
          >
            <p>Notre simulateur d'aides est intégrable de manière transparente en ajoutant une simple ligne de code à votre page web.</p>
            <p>
              Le script de son intégration est accessible
              <a
                href="https://github.com/betagouv/aides-simulateur-front/blob/main/client/public/iframe-integration.js"
                target="_blank"
              >sur le dépôt hébergeant notre code </a>.
            </p>

            <h3>
              Code d'intégration
            </h3>
            <p>Voici le script à intégrer sur votre site :</p>
            <DsfrCallout>
              <code class="fr-text--sm">{{ fullScript }}</code>
            </DsfrCallout>
            <p>Ce script créera l'iframe adéquate dans la div que vous aurez préalablement créé et sur votre site.</p>
            <DsfrCallout>
              <code class="fr-text--sm"> {{ divReference }} </code>
            </DsfrCallout>

            <div
              v-if="false"
              class="fr-form-group fr-mt-4w"
            >
              <div class="fr-grid-row">
                <div>
                  <DsfrFieldset
                    legend="Options d'affichage"
                    legend-class="fr-text--regular"
                    inline
                  >
                    <div class="fr-fieldset__content">
                      <DsfrRadioButtonSet
                        id="display-options-radio"
                        v-model="selectedDisplayOption"
                        :options="displayOptions"
                        name="display-options"
                        :inline="true"
                      />
                    </div>
                  </DsfrFieldset>
                </div>

                <div class="fr-ml-8w">
                  <DsfrFieldset
                    legend="Thème d'affichage"
                    legend-class="fr-text--regular"
                    inline
                  >
                    <DsfrRadioButtonSet
                      id="simulator-options-radio"
                      v-model="selectedSimulator"
                      :options="simulators"
                      name="simulator-options"
                      :inline="true"
                    />
                  </DsfrFieldset>
                </div>
              </div>
            </div>

            <h3>
              Prévisualisation
            </h3>
            <div class="fr-p-2w fr-background-alt--grey">
              <p>
                Voici un aperçu de l'intégration du simulateur sur votre site :
              </p>
              <div
                id="aides-simplifiees-iframe-container"
              />
            </div>

            <div class="fr-my-8w">
              <h3>Personnalisation</h3>
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
        </DsfrAccordionGroup>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>
