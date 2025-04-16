/**
 * This will make sure aide_id related data is in NuxtApp payload
 * before rendering any page that needs it.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const aideId = to.params.aide_id as string
  const { data, error } = await useAsyncData(`aide-${aideId}`, () => {
    return queryCollection('aides')
      .where('stem', '=', `aides/${aideId}`)
      .first()
  })
  if (!data.value) {
    throw createError({
      statusCode: 404,
      message: 'Aide non trouvée'
    })
  }
  if (error.value) {
    console.error('Erreur lors de la récupération de l\'aide :', error)
    throw createError({
      statusCode: 500,
      message: 'Erreur lors de la récupération de l\'aide'
    })
  }
})
