export const eur = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €'

export const chf = (cents: number, rate: number) =>
  '≈ ' + ((cents / 100) * rate).toFixed(2).replace('.', ',') + ' CHF'

export const dateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR')

export const plural = (n: number, singular: string, pluralForm = singular + 's') =>
  `${n} ${n > 1 ? pluralForm : singular}`
