/**
 * This will make sure simulateur_id related data is in NuxtApp payload
 * before rendering any page that needs it.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const simulateurId = to.params.simulateur_id as string
  const { data, error } = await useAsyncData(`simulateur-${simulateurId}`, () => {
    return queryCollection('simulateurs')
      .where('stem', '=', `simulateurs/${simulateurId}`)
      .first()
  })
  if (!data.value) {
    throw createError({
      statusCode: 404,
      message: 'Simulateur non trouvé'
    })
  }
  if (error.value) {
    console.error('Erreur lors de la récupération du simulateur :', error)
    throw createError({
      statusCode: 500,
      message: 'Erreur lors de la récupération du simulateur'
    })
  }
})
