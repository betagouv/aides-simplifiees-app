<script setup>
import { onMounted, ref } from 'vue'
import { getCookie, setCookie } from '~/utils/cookies'

const isModalOpen = ref(false)

// Check if user has already consented
function hasUserAnswered () {
  return getCookie('has_answered_mtm_consent') === 'true'
}

function openModal () {
  isModalOpen.value = true

  // Use setTimeout to ensure the modal is rendered before we check
  setTimeout(() => {
    // Check if matomo-opt-out is filled
    const optOut = document.getElementById('matomo-opt-out')
    if (optOut && !optOut.innerHTML.length) {
      const script = document.createElement('script')
      script.src = 'https://stats.beta.gouv.fr/index.php?module=CoreAdminHome&action=optOutJS&divId=matomo-opt-out&language=auto&showIntro=1'
      script.async = true
      document.body.appendChild(script)
    }
  }, 100)
}

function closeModal () {
  // When the user closes the modal, set the cookie to indicate they've answered
  setCookie('has_answered_mtm_consent', 'true')
  isModalOpen.value = false
}

// Check on mount if the user has already answered
onMounted(() => {
  if (!hasUserAnswered()) {
    // If user hasn't answered yet, automatically open the modal
    openModal()
  }
})
</script>

<template>
  <div>
    <DsfrModal
      :opened="isModalOpen"
      title="Gestion du suivi de navigation"
      @close="closeModal"
    >
      <div id="matomo-opt-out" />
      <div class="fr-mt-4w fr-text--right">
        <DsfrButton
          label="Mettre à jour mes préférences de suivi"
          @click="closeModal"
        />
      </div>
    </DsfrModal>
  </div>
</template>
