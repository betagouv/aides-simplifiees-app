<script setup lang="ts">
import type AuthController from '#controllers/auth_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { DsfrAlert, DsfrButton, DsfrButtonGroup, DsfrInputGroup } from '@gouvminint/vue-dsfr'
// import { DsfrCheckbox } from '@gouvminint/vue-dsfr'
import { Head, useForm, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
// import DsfrLink from '~/components/DsfrLink.vue'
import BrandBackgroundContainer from '~/components/layout/BrandBackgroundContainer.vue'
import SectionContainer from '~/components/layout/SectionContainer.vue'

interface PageProps {
  flash: {
    errors?: {
      form?: string
      email?: string
      password?: string
      [key: string]: string | undefined
    }
  }
}

const page = usePage<InferPageProps<AuthController, 'showLogin'> & PageProps>()

// Accéder aux messages flash depuis les données partagées
const errors = computed(() => {
  return page.props.flash?.errors || {}
})

const form = useForm({
  email: null,
  password: null,
})

function submitForm() {
  form.post('/login', {
    preserveScroll: true,
  })
}
const showPassword = ref(false)
function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
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
            <h2>
              Connexion
            </h2>

            <!-- Alerte pour l'erreur générale de formulaire -->
            <DsfrAlert
              v-if="errors?.form"
              type="error"
              title="Erreur de connexion"
              :description="errors.form"
              class="fr-mb-3w"
            />

            <form @submit.prevent="submitForm">
              <DsfrInputGroup
                v-model="form.email"
                label-visible
                label="Adresse e-mail"
                type="email"
                required
                :error-message="errors?.email"
              />
              <div class="password-field-container">
                <DsfrInputGroup
                  v-model="form.password"
                  label-visible
                  label="Mot de passe"
                  :type="showPassword ? 'text' : 'password'"
                  :error-message="errors?.password"
                  required
                />
                <DsfrButton
                  class="password-toggle-button"
                  :label="showPassword ? 'Masquer' : 'Afficher'"
                  :icon="{
                    name: showPassword ? 'ri:eye-off-line' : 'ri:eye-line',
                    ssr: true,
                  }"
                  size="sm"
                  tertiary
                  no-outline
                  type="submit"
                  :disabled="form.processing"
                  @click.prevent="togglePasswordVisibility"
                />
                <!-- <DsfrLink
                  to="/password/reset"
                  label="Mot de passe oublié ?"
                /> -->
              </div>
              <!-- <DsfrCheckbox
                class="fr-mt-2w"
                name="remember-me"
                small
                v-model="form.remember"
                label="Se souvenir de moi"
              /> -->
              <DsfrButtonGroup
                class="fr-mt-4w"
                :buttons="[{
                  label: 'Se connecter',
                  type: 'submit',
                  disabled: form.processing,
                }]"
              />
            </form>
          </div>
        </div>
      </div>
    </SectionContainer>
  </BrandBackgroundContainer>
</template>

<style scoped lang="scss">
.password-field-container {
  position: relative;
}

.password-toggle-button {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
