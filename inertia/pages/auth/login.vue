<script setup lang="ts">
import { DsfrAlert, DsfrButton, DsfrInput } from '@gouvminint/vue-dsfr'
import { Head, useForm, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'

// Récupération des props et des données partagées
const props = defineProps<{
  errors?: Record<string, string>
}>()

// Accéder aux messages flash depuis les données partagées
const page = usePage()
const flash = computed(() => page.props.flash || {})
const flashErrors = computed(() => {
  const flashObj = flash.value as any
  return (flashObj.errors || {}) as Record<string, string>
})

// Récupérer les anciennes valeurs du formulaire
const oldValues = computed(() => {
  const flashObj = flash.value as any
  return (flashObj.old || {}) as Record<string, string>
})

// Combiner les erreurs des props et des flash messages
const allErrors = computed(() => {
  return { ...(props.errors || {}), ...flashErrors.value }
})

const form = useForm({
  email: oldValues.value.email || '',
  password: '',
})

function submitForm() {
  form.post('/login', {
    preserveScroll: true,
  })
}
</script>

<template>
  <Head
    title="Connexion"
    description="Connectez-vous à votre compte Aides simplifiées pour accéder à votre espace administrateur."
  />
  <BrandBackgroundContainer
    textured
    blue
  >
    <SectionContainer>
      <div class="fr-grid-row fr-grid-row--center">
        <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <div class="fr-card fr-p-4w">
            <div class="fr-card__body">
              <div class="fr-card__content">
                <h2 class="">
                  Connexion
                </h2>

                <!-- Alerte pour l'erreur générale de formulaire -->
                <DsfrAlert
                  v-if="allErrors.form"
                  type="error"
                  title="Erreur de connexion"
                  :description="allErrors.form"
                  class="fr-mb-3w"
                />

                <form @submit.prevent="submitForm">
                  <div
                    id="login-form"
                    class="fr-fieldset"
                  >
                    <div class="fr-fieldset__element fr-mb-3w">
                      <DsfrInput
                        v-model="form.email"
                        label="Adresse e-mail"
                        type="email"
                        required
                      />
                      <p
                        v-if="allErrors.email"
                        class="fr-error-text"
                      >
                        {{ allErrors.email }}
                      </p>
                    </div>

                    <div class="fr-fieldset__element fr-mb-3w">
                      <DsfrInput
                        v-model="form.password"
                        label="Mot de passe"
                        type="password"
                        required
                      />
                      <p
                        v-if="allErrors.password"
                        class="fr-error-text"
                      >
                        {{ allErrors.password }}
                      </p>
                    </div>

                    <div class="fr-fieldset__element fr-mt-5w">
                      <DsfrButton
                        label="Se connecter"
                        type="submit"
                        :disabled="form.processing"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped lang="scss">
.fr-card {
  background-color: var(--background-default-grey);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.fr-error-text {
  color: var(--text-default-error);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
