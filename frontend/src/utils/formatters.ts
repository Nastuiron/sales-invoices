export function formatCurrency(
  amountCents: number,
): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100)
}

export function formatDate(
  value?: string,
): string {
  if (value === undefined) {
    return '—'
  }

  const dateOnlyPattern =
    /^(\d{4})-(\d{2})-(\d{2})$/

  const match = dateOnlyPattern.exec(value)

  const date =
    match === null
      ? new Date(value)
      : new Date(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
        )

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
  ).format(date)
}