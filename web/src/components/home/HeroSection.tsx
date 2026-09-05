import Link from 'next/link'
import { loc } from '@/lib/locale'

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null }
type Stat = { value?: string | null; label?: LocalizedStr | null }

type Props = {
  locale: string
  eyebrow?: string | null
  headline?: LocalizedStr | null
  subtext?: LocalizedStr | null
  stats?: Stat[] | null
}

const FALLBACK = {
  eyebrow: 'Est. 1983 · Point Asia Co., Ltd. · 律寶實業',
  headline: "Taiwan's components, finally with a voice.",
  subtext:
    "Test reports, product introductions, and shop-floor stories from the Taiwanese factories and workshops that keep the world's bikes rolling.",
  stats: [
    { value: '200+', label: 'Bike shops served worldwide' },
    { value: '40 yr', label: 'Taiwan component trade expertise' },
    { value: 'EN · 中 · 日 · DE', label: 'Four languages, one source' },
  ],
}

export function HeroSection({ locale, eyebrow, headline, subtext, stats }: Props) {
  const displayStats =
    stats?.length
      ? stats
      : FALLBACK.stats.map((s) => ({ value: s.value, label: { en: s.label } }))

  return (
    <section className="bg-brand relative overflow-hidden py-16 px-6">
      <div className="absolute right-[-80px] top-[-120px] w-[480px] h-[480px] rounded-full bg-white/[0.07] pointer-events-none" />
      <div className="absolute left-[55%] bottom-[-60px] w-[300px] h-[300px] rounded-full bg-black/[0.08] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/60 mb-5">
            {eyebrow || FALLBACK.eyebrow}
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold leading-[1.1] text-white text-balance mb-5">
            {loc(headline, locale) || FALLBACK.headline}
          </h1>
          <p className="font-serif text-[1.0625rem] text-white/80 leading-relaxed max-w-[40ch] mb-8">
            {loc(subtext, locale) || FALLBACK.subtext}
          </p>
          <Link
            href={`/${locale}/articles`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/15 border border-white/35 px-5 py-3 rounded hover:bg-white/[0.22] transition-colors"
          >
            Browse all articles →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {displayStats.map((stat, i) => (
            <div key={i} className="bg-black/15 border border-white/[0.12] rounded-lg px-6 py-5">
              <div className="font-serif text-[2.25rem] font-bold text-white leading-none mb-1">
                {stat.value}
              </div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/50">
                {loc(stat.label, locale)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
