export function formatDateTime(date: Date): {
  date: string
  time: string
} | null {
  if (!date) {
    return null
  }
  return {
    date: date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }
}
