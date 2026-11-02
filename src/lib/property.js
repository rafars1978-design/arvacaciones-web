// Default descriptions are generated from Smoobu data ("2 recámaras, 2 baños, hasta 6 huéspedes.").
// Rebuild them in the visitor's language; descriptions written by hand in the admin are shown as written.
const DEFAULT = /^(\d+) recámaras?, (\d+) baños?, hasta (\d+) huéspedes\.$/

export const localizedSummary = (property, t) => {
  const m = DEFAULT.exec(property.summary || '')
  if (!m) return property.summary
  const [, b, ba, g] = m.map(Number)
  const beds = `${b} ${b === 1 ? t('recámara') : t('recámaras')}`
  const baths = `${ba} ${ba === 1 ? t('baño') : t('baños')}`
  return `${beds}, ${baths}, ${t('hasta {g} huéspedes', { g })}.`
}
