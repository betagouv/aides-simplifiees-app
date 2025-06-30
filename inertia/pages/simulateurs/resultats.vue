<script lang="ts" setup>
import type SimulateurController from '#controllers/content/simulateur_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAccordion, DsfrAccordionsGroup, DsfrBadge, DsfrCallout, VIcon } from '@gouvminint/vue-dsfr'
import { Head, usePage } from '@inertiajs/vue3'
import { ref } from 'vue'
import AidesList from '~/components/aides/AidesList.vue'
import DsfrLink from '~/components/DsfrLink.vue'
import SectionSeparator from '~/components/layout/SectionSeparator.vue'
import { useMatomoTracking } from '~/composables/use_matomo_tracking'
import { useBreadcrumbStore } from '~/stores/breadcrumbs'
import { formatDateTime } from '~/utils/date_time'

const {
  props: {
    simulateur,
    secureHash,
    results,
    createdAt,
  },
} = usePage<InferPageProps<SimulateurController, 'showResultats' | 'showMockResultats'>>()

const hasAides = results.aides?.length > 0
const hasAidesNonEligibles = results.aidesNonEligibles?.length > 0
const hasTextesDeLoi = results.textesLoi?.length > 0

// Track eligibility in Matomo if we have results and aides
if (hasAides && results) {
  useMatomoTracking().trackEligibility(simulateur.slug, results.aides?.length || 0)
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

const activeAccordion = ref<number>(0)
const simulationDateTime = formatDateTime(createdAt)
</script>

<template>
  <Head
    :title="`Résultats de votre simulation '${simulateur.title}'`"
    :description="`Découvrez les aides auxquelles vous êtes eligibles avec les résultats de votre simulation '${simulateur.title}'.`"
  />
  <article>
    <header>
      <hgroup>
        <h2
          v-if="simulateur.title"
        >
          Résultats de votre simulation
        </h2>
        <p
          v-if="simulationDateTime"
          class="fr-mt-n2w"
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
    </header>
    <SectionSeparator class="fr-mt-4w" />
    <div class="fr-mt-4w results__warning">
      <DsfrBadge
        type="warning"
        small
        label="service en construction : ces résultats sont des estimations"
      />
    </div>
    <div class="fr-card fr-p-3w fr-mt-2w">
      <DsfrAccordionsGroup v-model="activeAccordion">
        <DsfrAccordion
          id="aides-eligibles"
        >
          <template #title>
            <VIcon
              name="ri:chat-check-line"
              ssr
            />
            <span class="fr-ml-1w">
              Les aides que vous pourriez percevoir
            </span>
          </template>
          <template v-if="hasAides">
            <div class="fr-mt-2w">
              <p class="fr-mb-4w">
                Selon les informations que vous avez fournies, vous pourriez être éligible à ces
                aides. Ces résultats sont basés uniquement sur les données communiquées et ne
                constituent pas un engagement officiel de la part des organismes mentionnés.
              </p>
              <AidesList
                v-if="results?.aides"
                :aides="(results.aides as RichSimulationResults['aides'])"
              />
            </div>
          </template>
          <template v-else>
            <div>
              <h3 class="fr-h5 fr-mt-2w">
                Nous n'avons pas trouvé d'aides correspondant à votre situation.
              </h3>
              <p>
                Cela peut être dû à des critères auxquels vous ne répondez pas, mais également à un
                erreur de notre part. Notre service est en construction, n'hésitez pas à consulter
                le détail des aides ci-dessous pour vérifier.
              </p>
            </div>
          </template>
        </DsfrAccordion>
        <DsfrAccordion
          v-if="hasAidesNonEligibles"
          id="aides-non-eligibles"
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
              :aides="(results.aidesNonEligibles as RichSimulationResults['aidesNonEligibles'])"
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
                <template v-if="!texteItem.url && texteItem.label">
                  {{ texteItem.label }}
                </template>
                <template v-else-if="texteItem.url && texteItem.label">
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
    <template v-if="simulateur.slug === 'demenagement-logement'">
      <DsfrCallout class="fr-mt-4w fr-callout--orange-terre-battue">
        <h3 class="fr-h4">
          D'autres aides existent !
        </h3>
        <p>
          Notre simulateur calcule pour l’instant votre éligibilité à 5 aides.
          Il existe d’autres aides au déménagement et au logement, notamment au niveau local.
          Nous vous invitons à consulter <a
            href="https://www.service-public.fr/particuliers/vosdroits/F38492"
            target="_blank"
            rel="noopener noreferrer"
          >le site Service-Public.fr</a> pour en savoir plus.
        </p>
      </DsfrCallout>
    </template>
  </article>
</template>

<style lang="scss" scoped>
.results__warning {
  display: flex;
  justify-content: flex-end;
}
</style>
