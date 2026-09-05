import Link from 'next/link'
import { loc } from '@/lib/locale'

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null }
type Props = {
  locale: string
  headline?: LocalizedStr | null
  subtext?: LocalizedStr | null
}

const JOIN_ROWS = [
  {
    key: 'shops',
    label: 'For Bike Shops',
    copy: 'I want to carry components I can actually trust and be able to offer them.',
  },
  {
    key: 'suppliers',
    label: 'For Suppliers',
    copy: 'We have been offering quality components for decades, and we want to make them available to bike shops around the world.',
  },
  {
    key: 'distributors',
    label: 'For Distributors',
    copy: 'Our retailers want better options. So do we.',
  },
]

const FALLBACK_HEADLINE = 'The trade source for shops, suppliers, and distributors.'
const FALLBACK_SUBTEXT =
  'Join at no cost. Patisco handles the purchasing — this site handles the intelligence.'

export function JoinStrip({ locale, headline, subtext }: Props) {
  return (
    <section className="bg-ink py-16 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-brand mb-4">
            Join the network
          </p>
          <h2 className="font-serif text-3xl lg:text-[2.25rem] font-bold text-white leading-[1.2] text-balance mb-5">
            {loc(headline, locale) || FALLBACK_HEADLINE}
          </h2>
          <p className="font-serif text-base text-white/55 leading-[1.7]">
            {loc(subtext, locale) || FALLBACK_SUBTEXT}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {JOIN_ROWS.map((row) => (
            <Link
              key={row.key}
              href={`/${locale}/join/${row.key}`}
              className="group flex items-center justify-between px-5 py-4 bg-white/5 border border-white/[0.09] rounded hover:bg-white/[0.09] hover:border-white/[0.16] transition-all"
            >
              <div>
                <div className="text-[0.9375rem] font-semibold text-white mb-0.5">
                  {row.label}
                </div>
                <div className="text-sm text-white/45 leading-snug">{row.copy}</div>
              </div>
              <span className="text-brand text-xl ml-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
