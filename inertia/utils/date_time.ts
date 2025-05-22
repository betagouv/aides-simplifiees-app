import { DateTime } from 'luxon'

export function formatDateTime(
  date: DateTime<boolean> | string | null | undefined,
  dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  },
): {
  date: string
  time: string
} | null {
  if (date === null || date === undefined) {
    return null
  }
  let dateObj: Date | null = null
  if (typeof date === 'string') {
    // Check if the string is a valid date
    const parsedDate = Date.parse(date)
    if (Number.isNaN(parsedDate)) {
      return null
    }
    dateObj = new Date(parsedDate)
  }
  else if (date instanceof DateTime) {
    dateObj = date.toJSDate()
  }
  if (dateObj !== null) {
    return {
      date: dateObj.toLocaleDateString('fr-FR', dateOptions),
      time: dateObj.toLocaleTimeString('fr-FR', timeOptions),
    }
  }
  return null
}
