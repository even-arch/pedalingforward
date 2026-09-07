import Link from "next/link";
import { getTranslations } from "next-intl/server";
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

const FALLBACK_HEADLINE: Record<string, string> = {
  en: "Taiwan's components, finally with a voice.",
  zh: "台灣零件，終於有了自己的聲音。",
  ja: "台湾パーツが、ついに語り始めた。",
  de: "Taiwanesische Komponenten. Endlich mit einer Stimme.",
};

const FALLBACK_SUBTEXT: Record<string, string> = {
  en: "Test reports, product introductions, and shop-floor stories from the Taiwanese factories and workshops that keep the world's bikes rolling.",
  zh: "來自台灣工廠與工坊的測試報告、產品介紹與現場故事，讓全球的自行車持續運轉。",
  ja: "世界中の自転車を支える台湾の工場・工房から届くテストレポート、製品紹介、現場ストーリー。",
  de: "Testberichte, Produktvorstellungen und Werkstattgeschichten aus den taiwanesischen Fabriken und Werkstätten, die die Fahrräder der Welt am Rollen halten.",
};

const FALLBACK = {
  eyebrow: "Est. 1983 · Point Asia Co., Ltd. · 律寶實業",
  stats: [
    { value: "200+",             label: { en: "Bike shops served worldwide",      zh: "全球合作車店",         ja: "世界中の提携店",         de: "Fahrradläden weltweit" } },
    { value: "40 YR",            label: { en: "Taiwan component trade expertise", zh: "台灣零件貿易經驗",     ja: "台湾部品取引の経験",     de: "Erfahrung im Taiwan-Komponentenhandel" } },
    { value: "EN · 中 · 日 · DE", label: { en: "Four languages, one source",      zh: "四種語言，一個來源",   ja: "4言語、1つの情報源",     de: "Vier Sprachen, eine Quelle" } },
  ],
};

const TICKER_ITEMS = [
  "Brake shoes", "Chains", "Hubs", "Stems", "Cables & housing",
  "Pedals", "Seatposts", "Rims", "Bearings", "Tools",
];

export async function HeroSection({ locale, eyebrow, headline, subtext, stats }: Props) {
  const t = await getTranslations({ locale, namespace: "home" });
  const displayStats = stats?.length ? stats : FALLBACK.stats;
  const fallbackHeadline = FALLBACK_HEADLINE[locale] ?? FALLBACK_HEADLINE.en;
  const fallbackSubtext  = FALLBACK_SUBTEXT[locale]  ?? FALLBACK_SUBTEXT.en;

  return (
    <>
      {/* ── Red hero ── */}
      <div className="field-red hero">
        <div className="mark" aria-hidden="true">
          <BrandMark />
        </div>
        <div className="wrap inner">
          <p className="lab">{eyebrow || FALLBACK.eyebrow}</p>
          <h1 className="display">{loc(headline, locale) || fallbackHeadline}</h1>
          <p className="lead">{loc(subtext, locale) || fallbackSubtext}</p>
          <Link href={`/${locale}/articles`} className="cta">
            {t("browseAll")} <span aria-hidden="true">→</span>
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
