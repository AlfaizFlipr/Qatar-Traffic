export function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatQar(amount: number): string {
  return `${amount.toLocaleString()} QAR`
}
