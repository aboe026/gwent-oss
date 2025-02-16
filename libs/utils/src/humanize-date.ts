/**
 * Convert an ISO string into a human readable day.
 *
 * @param isoString The ISO string to convert into a formatted day string.
 * @returns The ISO string day in a "MMMM D, YYYY" format.
 */
export function humanizeDay(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Convert an ISO string into a human readable time.
 *
 * @param isoString The ISO string to convert into a formatted time string.
 * @returns The ISO string time in a "h:m A" format.
 */
export function humanizeTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-us', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
}
