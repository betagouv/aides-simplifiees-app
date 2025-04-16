/**
 * This will make sure notion_id related data is in NuxtApp payload
 * before rendering any page that needs it.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const notionId = to.params.notion_id as string
  const { data, error } = await useAsyncData(`notion-${notionId}`, () => {
    return queryCollection('notions')
      .where('stem', '=', `notions/${notionId}`)
      .first()
  })
  if (!data.value) {
    throw createError({
      statusCode: 404,
      message: 'Notion non trouvée'
    })
  }
  if (error.value) {
    console.error('Erreur lors de la récupération de la notion :', error)
    throw createError({
      statusCode: 500,
      message: 'Erreur lors de la récupération de la notion'
    })
  }
})
