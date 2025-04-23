<script lang="ts" setup>
import IframeLayout from '~/components/layout/IframeLayout.vue'
import SharedDsfrLayout from '~/components/layout/SharedDsfrLayout.vue'
import UserSimulationLayout from '~/components/layout/UserSimulationLayout.vue'
import { useIframeDisplay } from '~/composables/use_is_iframe'

const { isIframe } = useIframeDisplay()
</script>

<template>
  <div v-if="isIframe">
    <IframeLayout>
      <slot />
    </IframeLayout>
  </div>
  <div v-else>
    <SharedDsfrLayout>
      <UserSimulationLayout>
        <slot />
      </UserSimulationLayout>
    </SharedDsfrLayout>
  </div>
</template>
