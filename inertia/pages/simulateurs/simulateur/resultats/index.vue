<script lang="ts" setup>
definePageMeta({
  layout: 'user-simulation',
  middleware: [
    'check-iframe-layout',
    'load-simulateur',
    'load-results'
  ],
  validate: getContentRouteValidator('simulateur_id')
})

const route = useRoute()
const nuxtApp = useNuxtApp()
const simulateurId = route.params.simulateur_id as string
const simulateur = nuxtApp.payload.data[`simulateur-${simulateurId}`]
const simulateurTitle = simulateur?.titre || simulateurId

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle, to: `/simulateurs/${simulateurId}#simulateur-title` },
  { text: 'Résultats', to: `/simulateurs/${simulateurId}/resultats#simulateur-title` }
])

useSeoMeta({
  title: `Résultats de votre simulation "${simulateurTitle}" | Aides simplifiées`,
  description: `Découvrez les aides auxquelles vous êtes eligibles avec les résultats de votre simulation "${simulateurTitle}".`
})

const richResults = nuxtApp.payload.data[`rich-results-${simulateurId}`]
const showMethodology = ref(false)
const hasAides = richResults.aides.length > 0
const hasEcheances = richResults.echeances.length > 0
const hasMontants = richResults.montants.length > 0
const hasAidesNonEligibles = richResults.aidesNonEligibles.length > 0
const hasTextesDeLoi = richResults.textesLoi.length > 0

const segmentedSetOptions: { label: string, value: string, icon: string }[] = []
if (hasEcheances) {
  segmentedSetOptions.unshift({ label: 'Échéances estimées', value: 'echeances', icon: 'ri:calendar-2-line' })
}
if (hasMontants) {
  segmentedSetOptions.unshift({ label: 'Montants estimés', value: 'montants', icon: 'ri:money-euro-circle-line' })
}

const visibleTabName = ref<'montants' | 'echeances'>('montants')

const activeAccordion = ref<number>()

// stats if hasAides
if (hasAides) {
  useMatomo().trackEligibility(simulateurId, richResults.aides.length)
}
</script>

<template>
  <article class="results">
    <header class="results__header">
      <!-- <header class="results__header fr-grid-row fr-grid-row--gutters"> -->
      <div>
        <!-- <div class="fr-col-9"> -->
        <hgroup>
          <h2
            v-if="simulateurTitle"
            class="results__title"
          >
            Résultats de votre simulation
          </h2>
          <p
            v-if="richResults.createAt?.date && richResults.createAt?.time"
            class="results__datetime fr-mt-n2w"
            :style="{ color: 'var(--text-mention-grey)' }"
          >
            Simulation terminée le {{ richResults.createAt.date }} à {{ richResults.createAt.time }}
          </p>
        </hgroup>
        <DsfrLink
          class="results__backlink"
          icon-before
          label="Reprendre ma simulation"
          :to="`/simulateurs/${simulateurId}/recapitulatif/#simulateur-title`"
          :icon="{ name: 'ri:arrow-left-line', ssr: true }"
        />
      </div>
      <!-- <div class="results__header-actions fr-col-3">
        <DsfrButtonGroup
          inline-layout-when="always"
          :buttons="[
            {
              label: 'Imprimer les résultats',
              icon: 'ri:printer-line',
              iconOnly: true,
              secondary: true,
            },
            {
              label: 'M\'envoyer les résultats par mail',
              icon: 'ri:mail-line',
              iconOnly: true,
            },
          ]"
        />
      </div> -->
    </header>
    <SectionSeparator
      v-if="hasAides"
      fluid
      class="fr-mt-6w"
    />
    <div class="results__content fr-mt-4w">
      <template v-if="hasAides">
        <div class="results__content-resume">
          <hgroup>
            <h3>1. En résumé</h3>
            <p class="fr-text--lg">
              Voici un récapitulatif des aides auxquelles vous pourriez être éligible en fonction des informations
              renseignées :
            </p>
          </hgroup>
          <DsfrSegmentedSet
            v-if="segmentedSetOptions && segmentedSetOptions.length > 1"
            v-model="visibleTabName"
            name="resume"
            label="En résumé"
            :options="segmentedSetOptions"
          />
          <div class="results__warning">
            <DsfrBadge
              type="warning"
              small
              label="service en construction : ces résultats sont des estimations"
            />
          </div>
          <div
            v-if="hasMontants && visibleTabName === 'montants'"
            class="fr-card fr-p-3w fr-mt-2w results__montants"
          >
            <div
              v-for="montant in richResults.montants"
              :key="montant.type"
              class="results__montant"
            >
              <AideMontantCard v-bind="montant" />
            </div>
          </div>
          <div v-else-if="hasEcheances && visibleTabName === 'echeances'">
            <!-- todo -->
          </div>
        </div>
        <SectionSeparator
          fluid
          class="fr-mt-8w"
        />
        <div class="results__liste-aides fr-mt-8w">
          <h3>2. Les aides que nous avons identifiées</h3>
          <p>
            Selon les informations que vous avez fournies, vous pourriez être éligible à ces aides.
            Ces résultats sont basés uniquement sur les données communiquées et ne constituent pas un engagement
            officiel de la part des organismes mentionnés.
          </p>
          <AidesList :aides="richResults.aides" />
        </div>
        <template v-if="hasAidesNonEligibles || hasTextesDeLoi || showMethodology">
          <SectionSeparator
            fluid
            class="fr-mt-8w"
          />
          <div class="results__liste-annexes fr-mt-8w">
            <h3>3. Pour aller plus loin</h3>
            <div class="fr-card">
              <div class="fr-card__body">
                <div class="fr-card__content">
                  <DsfrAccordionsGroup v-model="activeAccordion">
                    <DsfrAccordion
                      v-if="showMethodology"
                      id="methodologie"
                    >
                      <template #title>
                        <VIcon
                          name="ri:question-line"
                          ssr
                        />
                        <span class="fr-ml-1w">
                          Comment avons nous estimé ces aides ?
                        </span>
                      </template>
                      <template #default>
                        Contenu à venir
                      </template>
                    </DsfrAccordion>
                    <DsfrAccordion
                      v-if="hasAidesNonEligibles"
                      id="aides-non-eligibles"
                      title=""
                    >
                      <template #title>
                        <VIcon
                          name="ri:chat-delete-line"
                          ssr
                        />
                        <span class="fr-ml-1w">
                          Les aides auxquelles vous n'avez pas été estimé·e éligible
                        </span>
                      </template>
                      <template #default>
                        <AidesList :aides="richResults.aidesNonEligibles" />
                      </template>
                    </DsfrAccordion>
                    <DsfrAccordion
                      v-if="hasTextesDeLoi"
                      id="textes-reference"
                      title="Textes de référence"
                    >
                      <template #title>
                        <VIcon
                          name="ri:scales-3-line"
                          ssr
                        />
                        <span class="fr-ml-1w">
                          Textes de référence
                        </span>
                      </template>
                      <template #default>
                        <ul>
                          <li
                            v-for="texteItem, i in richResults.textesLoi"
                            :key="i"
                            class="fr-mb-1w"
                          >
                            <template v-if="typeof texteItem === 'string'">
                              {{ texteItem }}
                            </template>
                            <template v-else-if="texteItem && texteItem.url && texteItem.label">
                              <span v-if="texteItem.prefixe">
                                {{ texteItem.prefixe }} :
                              </span>
                              <DsfrLink
                                :to="texteItem.url"
                                :icon="{ name: 'ri:external-link-line', ssr: true }"
                                :label="texteItem.label"
                              />
                            </template>
                          </li>
                        </ul>
                      </template>
                    </DsfrAccordion>
                  </DsfrAccordionsGroup>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
      <template v-else>
        <div class="results__no-aides fr-card fr-p-3w">
          <h3>
            Nous n'avons pas trouvé d'aides correspondant à votre situation.
          </h3>
          <p>
            Cela peut être dû à des critères auxquels vous ne répondez pas, mais également à un erreur de notre part.
            Notre service est en construction, n'hésitez pas à consulter le détail des aides suivantes pour vérifier :
          </p>
          <DsfrAccordion
            v-if="hasAidesNonEligibles"
            id="aides-non-eligibles"
            title=""
          >
            <template #title>
              <VIcon
                name="ri:chat-delete-line"
                ssr
              />
              <span class="fr-ml-1w">
                Les aides auxquelles vous n'avez pas été estimé·e éligible
              </span>
            </template>
            <template #default>
              <AidesList :aides="richResults.aidesNonEligibles" />
            </template>
          </DsfrAccordion>
        </div>
      </template>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.results__warning {
  display: flex;
  justify-content: flex-end;
}
.results__montants {
  display: flex;
  gap: 1.5rem;

  .results__montant:not(:last-child) {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-default-grey);
  }
}
</style>
