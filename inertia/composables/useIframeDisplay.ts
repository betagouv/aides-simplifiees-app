export function useIframeDisplay () {
  const route = useRoute()

  const isIframe = computed(() => {
    return isIframeRoute(route)
  })

  const displayOption = computed(() => {
    return route.query['data-display-option'] || ''
  })

  return {
    isIframe,
    displayOption,
  }
}
