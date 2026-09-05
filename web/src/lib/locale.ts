type LocalizedValue =
  | { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null }
  | null
  | undefined

export function loc(value: LocalizedValue, locale: string): string {
  if (!value) return ''
  const keyed = value as Record<string, string | null | undefined>
  return keyed[locale] ?? keyed['en'] ?? ''
}

export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const map: Record<string, string> = { en: 'en-US', zh: 'zh-TW', ja: 'ja-JP', de: 'de-DE' }
  return new Date(iso).toLocaleDateString(map[locale] ?? 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}
