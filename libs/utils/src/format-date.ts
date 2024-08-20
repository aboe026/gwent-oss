export function formatDay(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-us', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
}
