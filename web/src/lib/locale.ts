type LocalizedValue =
  | { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null }
  | null
  | undefined

export function loc(value: LocalizedValue, locale: string): string {
  if (!value) return ''
  const keyed = value as Record<string, string | null | undefined>
  return keyed[locale] || keyed['en'] || ''
}

export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const map: Record<string, string> = { en: 'en-US', zh: 'zh-TW', ja: 'ja-JP', de: 'de-DE' }
  return new Date(iso).toLocaleDateString(map[locale] ?? 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function formatDateWithWeek(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const map: Record<string, string> = { en: 'en-US', zh: 'zh-TW', ja: 'ja-JP', de: 'de-DE' }
  const month = d.toLocaleDateString(map[locale] ?? 'en-US', { month: 'long', year: 'numeric' })
  const w = isoWeek(d)
  const week = locale === 'zh' ? `W${w}` : locale === 'ja' ? `第${w}週` : `W${w}`
  return `${month} · ${week}`
}
