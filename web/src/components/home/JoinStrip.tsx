import Link from "next/link";
import { loc } from "@/lib/locale";

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };
type Props = { locale: string; headline?: LocalizedStr | null; subtext?: LocalizedStr | null };

const JOIN_NETWORK: LocalizedStr = { en: "Join the network", zh: "加入網絡", ja: "ネットワークに参加する", de: "Dem Netzwerk beitreten" };

const FALLBACK_HEADLINE: LocalizedStr = {
  en: "The trade source for shops, suppliers, and distributors.",
  zh: "專為車店、供應商和通路商打造的貿易資訊平台。",
  ja: "ショップ、サプライヤー、ディストリビューターのための貿易情報源。",
  de: "Die Handelsquelle für Shops, Lieferanten und Distributoren.",
};

const FALLBACK_SUBTEXT: LocalizedStr = {
  en: "Join at no cost. Patisco handles the purchasing — this site handles the intelligence.",
  zh: "免費加入。Patisco 負責採購，這個網站負責情報。",
  ja: "無料で参加できる。Patisco が購買を担い、このサイトがインテリジェンスを担う。",
  de: "Kostenlos beitreten. Patisco übernimmt den Kauf — diese Site die Marktintelligenz.",
};

const JOIN_ROWS: { key: string; label: LocalizedStr; copy: LocalizedStr }[] = [
  {
    key: "shops",
    label: { en: "For bike shops", zh: "車店專區", ja: "ショップ向け", de: "Für Shops" },
    copy: {
      en: "I want to carry components I can actually trust and be able to offer them.",
      zh: "我想進真正說得過去、能向客人推薦的零件。",
      ja: "自信を持って提供できるコンポーネントを仕入れたい。",
      de: "Ich möchte Komponenten führen, denen ich wirklich vertrauen kann.",
    },
  },
  {
    key: "suppliers",
    label: { en: "For suppliers", zh: "供應商專區", ja: "サプライヤー向け", de: "Für Lieferanten" },
    copy: {
      en: "We have been offering quality components for decades, and we want to make them available to bike shops around the world.",
      zh: "我們做了幾十年的好零件，希望讓全球的車店都能取得。",
      ja: "何十年も品質の高いコンポーネントを提供してきた。世界中のショップに届けたい。",
      de: "Wir bieten seit Jahrzehnten qualitativ hochwertige Komponenten an und möchten sie weltweit zugänglich machen.",
    },
  },
  {
    key: "distributors",
    label: { en: "For distributors", zh: "通路商專區", ja: "ディストリビューター向け", de: "Für Händler" },
    copy: {
      en: "Our retailers want better options. So do we.",
      zh: "我們的零售商要更好的選擇，我們也是。",
      ja: "私たちの小売店はより良い選択肢を求めている。私たちも同じだ。",
      de: "Unsere Händler wollen bessere Optionen. Wir auch.",
    },
  },
];

export function JoinStrip({ locale, headline, subtext }: Props) {
  return (
    <section className="field-red">
      <div className="wrap">
        <p className="lab" style={{ color: "rgba(255,255,255,.8)", marginBottom: "26px" }}>
          {loc(JOIN_NETWORK, locale)}
        </p>
        <h2 className="display">
          {loc(headline, locale) ?? loc(FALLBACK_HEADLINE, locale)}
        </h2>
        <p className="lead" style={{ marginTop: "24px", color: "rgba(255,255,255,.92)" }}>
          {loc(subtext, locale) ?? loc(FALLBACK_SUBTEXT, locale)}
        </p>

        <div className="rows">
          {JOIN_ROWS.map((row) => (
            <Link key={row.key} href={`/${locale}/${row.key}`} className="row">
              <span className="lab">{loc(row.label, locale)}</span>
              <span className="cp">{loc(row.copy, locale)}</span>
              <span className="ar" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
