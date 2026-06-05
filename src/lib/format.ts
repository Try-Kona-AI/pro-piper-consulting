export function money(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function shortDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function daysAgo(d: string | null): number | null {
  if (!d) return null
  const then = new Date(d + 'T00:00:00').getTime()
  const now = new Date().setHours(0, 0, 0, 0)
  return Math.round((now - then) / 86400000)
}
