<script lang="ts" setup>
import { DsfrAccordion, DsfrAccordionsGroup, DsfrBadge, DsfrButton, DsfrSegmentedSet, VIcon } from '@gouvminint/vue-dsfr'
import { Head, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AideMontantCard from '~/components/aides/AideMontantCard.vue'
import AidesList from '~/components/aides/AidesList.vue'
import DsfrLink from '~/components/DsfrLink.vue'
import SectionSeparator from '~/components/layout/SectionSeparator.vue'
import { useMatomo } from '~/composables/useMatomo'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'

const page = usePage<{
  props: {
    simulateur: {
      title: string
      slug: string
    }
    formSubmission: {
      results: {
        aides?: any[]
        aidesNonEligibles?: any[]
        echeances?: any[]
        montants?: any[]
        textesLoi?: any[]
        createAt?: string
      }
      createdAt: string
    }
    secureHash: string | null
  }
}>()

// Get props
const simulateur = computed(() => page.props.simulateur)
const formSubmission = computed(() => page.props.formSubmission)
const secureHash = computed(() => page.props.secureHash)

// Computed from props
const simulateurTitle = computed(() => simulateur.value?.title || simulateur.value?.slug)
const simulateurId = computed(() => simulateur.value.slug)
const results = computed(() => formSubmission.value?.results || null)

const { setBreadcrumbs } = useBreadcrumbStore()

setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateurTitle.value, to: `/simulateurs/${simulateurId.value}#simulateur-title` },
  {
    text: 'Résultats',
    to: `/simulateurs/${simulateurId.value}/resultats${secureHash.value ? `/${secureHash.value}` : ''}#simulateur-title`,
  },
])

const showMethodology = ref(false)
// Computed from results (ie. formSubmission.results)
const simulationDateTime = computed(() => {
  if (results.value?.createAt) {
    return results.value.createAt
  }

  // Otherwise format it from submission createdAt
  if (!formSubmission.value?.createdAt)
    return null

  const createdAt = new Date(formSubmission.value.createdAt)

  // Format date: "DD/MM/YYYY"
  const date = createdAt.toLocaleDateString('fr-FR')

  // Format time: "HH:MM"
  const time = createdAt.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return { date, time }
})
const hasAides = computed(
  () => Array.isArray(results.value?.aides) && results.value.aides.length > 0,
)
const hasEcheances = computed(
  () => Array.isArray(results.value?.echeances) && results.value.echeances.length > 0,
)
const hasMontants = computed(
  () => Array.isArray(results.value?.montants) && results.value.montants.length > 0,
)
const hasAidesNonEligibles = computed(
  () =>
    Array.isArray(results.value?.aidesNonEligibles) && results.value.aidesNonEligibles.length > 0,
)
const hasTextesDeLoi = computed(
  () => Array.isArray(results.value?.textesLoi) && results.value.textesLoi.length > 0,
)

// Track eligibility in Matomo if we have results and aides
if (hasAides.value && results.value) {
  // useMatomo().trackEligibility(simulateurId.value, results.value.aides?.length || 0)
}

// For ui / ux
const segmentedSetOptions = computed(() => {
  const options = []
  if (hasMontants.value) {
    options.unshift({
      label: 'Montants estimés',
      value: 'montants',
      icon: 'ri:money-euro-circle-line',
    })
  }
  if (hasEcheances.value) {
    options.unshift({
      label: 'Échéances estimées',
      value: 'echeances',
      icon: 'ri:calendar-2-line',
    })
  }
  return options
})
const visibleTabName = ref('montants')
const activeAccordion = ref()
</script>

<template>
  <Head
    :title="`Résultats de votre simulation '${simulateurTitle}' | Aides simplifiées`"
    :description="`Découvrez les aides auxquelles vous êtes eligibles avec les résultats de votre simulation '${simulateurTitle}'.`"
  />
  <article class="results">
    <header class="results__header">
      <div>
        <hgroup>
          <h2
            v-if="simulateurTitle"
            class="results__title"
          >
            Résultats de votre simulation
          </h2>
          <p
            v-if="simulationDateTime?.date && simulationDateTime?.time"
            class="results__datetime fr-mt-n2w"
            :style="{ color: 'var(--text-mention-grey)' }"
          >
            Simulation terminée le {{ simulationDateTime.date }} à {{ simulationDateTime.time }}
            <span v-if="hasAides && results?.aides">
              ({{ results.aides.length }} aide(s) éligible(s))
            </span>
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
    </header>

    <template v-if="formSubmission">
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
                Voici un récapitulatif des aides auxquelles vous pourriez être éligible en
                fonction des informations renseignées :
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
              v-if="hasMontants && visibleTabName === 'montants' && results?.montants"
              class="fr-card fr-p-3w fr-mt-2w results__montants"
            >
              <div
                v-for="montant in results.montants"
                :key="montant.usageAide"
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
              Selon les informations que vous avez fournies, vous pourriez être éligible à ces
              aides. Ces résultats sont basés uniquement sur les données communiquées et ne
              constituent pas un engagement officiel de la part des organismes mentionnés.
            </p>

            <AidesList
              v-if="results?.aides"
              :aides="results.aides"
            />
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
                          <span class="fr-ml-1w"> Comment avons nous estimé ces aides ? </span>
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
                          <AidesList
                            v-if="results?.aidesNonEligibles"
                            :aides="results.aidesNonEligibles"
                          />
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
                          <span class="fr-ml-1w"> Textes de référence </span>
                        </template>
                        <template #default>
                          <ul v-if="results?.textesLoi">
                            <li
                              v-for="(texteItem, i) in results.textesLoi"
                              :key="i"
                              class="fr-mb-1w"
                            >
                              <template v-if="typeof texteItem === 'string'">
                                {{ texteItem }}
                              </template>
                              <template v-else-if="texteItem && texteItem.url && texteItem.label">
                                <span v-if="texteItem.prefix"> {{ texteItem.prefix }} : </span>
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
            <h3>Nous n'avons pas trouvé d'aides correspondant à votre situation.</h3>
            <p>
              Cela peut être dû à des critères auxquels vous ne répondez pas, mais également à un
              erreur de notre part. Notre service est en construction, n'hésitez pas à consulter
              le détail des aides suivantes pour vérifier :
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
                <AidesList :aides="results.aidesNonEligibles" />
              </template>
            </DsfrAccordion>
          </div>
        </template>
      </div>
    </template>

    <template v-else>
      <div class="results__no-data fr-card fr-p-3w fr-mt-4w">
        <h3>Aucun résultat à afficher</h3>
        <p>
          Vous devez d'abord terminer une simulation avant de pouvoir consulter vos résultats.
        </p>
        <DsfrButton
          :to="`/simulateurs/${simulateurId}`"
          label="Commencer une simulation"
        />
      </div>
    </template>
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
