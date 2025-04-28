<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
/**
 * We need to map props from Vue-router link to Inertia Link.
 * This is because @gouvminint/vue-dsfr uses vue-router RouterLink component internally.
 * @see https://v3.router.vuejs.org/fr/api/#router-link-props
 */
interface VueRouterLinkProps {
  to: string | { path: string }
  replace?: boolean
  append?: boolean
  tag?: string
  activeClass?: string
  exact?: boolean
  exactActiveClass?: string
  ariaCurrentValue?: string
  custom?: boolean
}

const props = defineProps<VueRouterLinkProps>()
const href = computed(() => {
  return typeof props.to === 'string' ? props.to : props.to.path || ''
})

const page = usePage()
</script>

<template>
  <Link
    v-bind="{
      ...props,
      href,
      'aria-current': page.url === href ? 'page' : undefined,
    }"
  >
    <slot />
  </Link>
</template>
