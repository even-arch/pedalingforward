import Link from "next/link";
import { loc } from "@/lib/locale";
import { BrandMark } from "@/components/BrandMark";

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };
type Stat = { value?: string | null; label?: LocalizedStr | null };

type Props = {
  locale: string;
  eyebrow?: string | null;
  headline?: LocalizedStr | null;
  subtext?: LocalizedStr | null;
  stats?: Stat[] | null;
};

const FALLBACK = {
  eyebrow: "Est. 1983 · Point Asia Co., Ltd. · 律寶實業",
  headline: "Taiwan's components, finally with a voice.",
  subtext:
    "Test reports, product introductions, and shop-floor stories from the Taiwanese factories and workshops that keep the world's bikes rolling.",
  stats: [
    { value: "200+",             label: { en: "Bike shops served worldwide" } },
    { value: "40 YR",            label: { en: "Taiwan component trade expertise" } },
    { value: "EN · 中 · 日 · DE", label: { en: "Four languages, one source" } },
  ],
};

const TICKER_ITEMS = [
  "Brake shoes", "Chains", "Hubs", "Stems", "Cables & housing",
  "Pedals", "Seatposts", "Rims", "Bearings", "Tools",
];

export function HeroSection({ locale, eyebrow, headline, subtext, stats }: Props) {
  const displayStats = stats?.length ? stats : FALLBACK.stats;

  return (
    <>
      {/* ── Red hero ── */}
      <div className="field-red hero">
        <div className="mark" aria-hidden="true">
          <BrandMark />
        </div>
        <div className="wrap inner">
          <p className="lab">{eyebrow || FALLBACK.eyebrow}</p>
          <h1 className="display">{loc(headline, locale) || FALLBACK.headline}</h1>
          <p className="lead">{loc(subtext, locale) || FALLBACK.subtext}</p>
          <Link href={`/${locale}/articles`} className="cta">
            Browse all articles <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* ── Ticker ── */}
      <div className="ticker" aria-hidden="true">
        <div className="track">
          {TICKER_ITEMS.concat(TICKER_ITEMS).map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── Stats (dark bg) ── */}
      <div className="field-ink">
        <div className="wrap">
          <div className="stats">
            {displayStats.map((stat, i) => (
              <div key={i} className="stat">
                <div className={`n${stat.value && stat.value.length > 6 ? " sm" : ""}`}>
                  {stat.value}
                </div>
                <div className="k">{loc(stat.label, locale)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
