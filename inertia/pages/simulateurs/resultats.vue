<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAccordion, DsfrAccordionsGroup, DsfrBadge, VIcon } from '@gouvminint/vue-dsfr'
import { Head, usePage } from '@inertiajs/vue3'
import { ref } from 'vue'
import AideMontantCard from '~/components/aides/AideMontantCard.vue'
import AidesList from '~/components/aides/AidesList.vue'
import DsfrLink from '~/components/DsfrLink.vue'
import SectionSeparator from '~/components/layout/SectionSeparator.vue'
import { useMatomo } from '~/composables/use_matomo'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { formatDateTime } from '~/utils/date_time'

const {
  props: {
    simulateur,
    secureHash,
    results,
    createdAt,
  },
} = usePage<InferPageProps<SimulateurController, 'showResultats'>>()

const hasAides = results.aides?.length > 0
const hasMontants = results.montants?.length > 0
const hasAidesNonEligibles = results.aidesNonEligibles?.length > 0
const hasTextesDeLoi = results.textesLoi?.length > 0

// Track eligibility in Matomo if we have results and aides
if (hasAides && results) {
  useMatomo().trackEligibility(simulateur.slug, results.aides?.length || 0)
}

const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateur.title, to: `/simulateurs/${simulateur.slug}#simulateur-title` },
  {
    text: 'Résultats',
    to: `/simulateurs/${simulateur.slug}/resultats${secureHash ? `/${secureHash}` : ''}#simulateur-title`,
  },
])

const showResume = ref(false)
const showMethodology = ref(false)
const activeAccordion = ref()

const simulationDateTime = formatDateTime(createdAt)
</script>

<template>
  <Head
    :title="`Résultats de votre simulation '${simulateur.title}'`"
    :description="`Découvrez les aides auxquelles vous êtes eligibles avec les résultats de votre simulation '${simulateur.title}'.`"
  />
  <article class="results">
    <header class="results__header">
      <div>
        <hgroup>
          <h2
            v-if="simulateur.title"
            class="results__title"
          >
            Résultats de votre simulation
          </h2>
          <p
            v-if="simulationDateTime"
            class="results__datetime fr-mt-n2w"
            :style="{ color: 'var(--text-mention-grey)' }"
          >
            Simulation terminée le {{ simulationDateTime.date }} à {{ simulationDateTime.time }}
          </p>
        </hgroup>
        <DsfrLink
          class="results__backlink"
          icon-before
          label="Reprendre ma simulation"
          :to="`/simulateurs/${simulateur.slug}/recapitulatif/#simulateur-title`"
          preserve-scroll
          preserve-state
          :icon="{ name: 'ri:arrow-left-line', ssr: true }"
        />
      </div>
    </header>
    <SectionSeparator
      v-if="hasAides"
      fluid
      class="fr-mt-6w"
    />
    <div class="results__content fr-mt-4w">
      <template v-if="hasAides">
        <template v-if="showResume">
          <div
            class="results__content-resume"
          >
            <hgroup>
              <h3>1. En résumé</h3>
              <p class="fr-text--lg">
                Voici un récapitulatif des aides auxquelles vous pourriez être éligible en
                fonction des informations renseignées :
              </p>
            </hgroup>

            <div class="results__warning">
              <DsfrBadge
                type="warning"
                small
                label="service en construction : ces résultats sont des estimations"
              />
            </div>
            <div
              v-if="hasMontants"
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
          </div>
          <SectionSeparator
            fluid
            class="fr-mt-8w"
          />
        </template>
        <div class="results__liste-aides fr-mt-8w">
          <h3>{{ showResume ? '2. ' : '1.' }} Les aides que nous avons identifiées</h3>
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
            <h3>{{ showResume ? '3. ' : '2.' }} Pour aller plus loin</h3>
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
