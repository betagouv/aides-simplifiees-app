<script setup lang="ts">
import { DsfrAlert } from '@gouvminint/vue-dsfr'
/**
 * This component displays a message when the question type is not recognized.
 * It is used as a fallback for unknown question types in the survey.
 */
</script>

<template>
  <DsfrAlert
    type="error"
    title="Type de question inconnu"
  />
</template>
