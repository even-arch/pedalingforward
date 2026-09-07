import { BrandMark } from "@/components/BrandMark";

type Locale = "en" | "zh" | "ja" | "de";

const COPY: Record<Locale, {
  eyebrow: string; headline: string; lead: string; body: string;
  specSet: [string, string]; specWrite: [string, string]; specBuyers: [string, string]; specOrders: [string, string];
  h2Gap: string; gapP1: string; gapP2: string;
  h2Benefits: string;
  b1h: string; b1p: string; b2h: string; b2p: string; b3h: string; b3p: string; b4h: string; b4p: string;
  ctaH: string; ctaBtn: string; ctaFine: string;
}> = {
  en: {
    eyebrow: "For suppliers",
    headline: "Your components deserve a wider audience.",
    lead: "You've been making quality parts for decades. Some of the world's best-known bikes have your components inside them — they just don't say so.",
    body: "Independent shops worldwide would carry your products if they could find them, verify them, and order them in quantities that make sense.",
    specSet:    ["You set",    "Price · MOQ · Lead time"],
    specWrite:  ["We write in","EN · 中 · 日 · DE"],
    specBuyers: ["Buyers",     "Verified trade only"],
    specOrders: ["Orders",     "Aggregated"],
    h2Gap: "The gap we close",
    gapP1: "Reaching overseas independent shops is expensive and complicated. Minimum order quantities, language barriers, and distribution layers eat into margin before the first unit ships.",
    gapP2: "Pedaling Forward introduces your components to an audience of verified shop owners, buyers, and distributors who are actively looking for better sourcing options. When interest is high enough, Patisco aggregates the orders — so you hit your MOQ without negotiating with dozens of shops one at a time.",
    h2Benefits: "What you get",
    b1h: "Editorial exposure in four languages",
    b1p: "We write about your products in English, Chinese, Japanese, and German — test reports, spec breakdowns, and factory context that helps buyers understand what they're looking at.",
    b2h: "Demand aggregation",
    b2p: "Orders come in as a group buy, not one small purchase at a time. You set the price, MOQ, and lead time. We handle the buyer side.",
    b3h: "Qualified buyers only",
    b3p: "Every member is verified by our team at Point Asia. You're talking to trade professionals — shop owners, buyers, distributors.",
    b4h: "You stay in control",
    b4p: "You set the terms. We facilitate the connection and handle order logistics through Patisco.",
    ctaH: "List your products",
    ctaBtn: "Talk to us →",
    ctaFine: "We're selective about what we feature. If your products are worth knowing, we'd like to hear from you.",
  },
  zh: {
    eyebrow: "供應商專區",
    headline: "你的零件值得被更多人看見。",
    lead: "你已經做了幾十年的好零件。世界上某些最知名的自行車裡，就裝著你的組件——只是沒有人說出來。",
    body: "全球的獨立車店願意引進你的產品，只要他們找得到、驗得了、訂得起合理的量。",
    specSet:    ["你決定",   "售價 · 最低起訂量 · 交期"],
    specWrite:  ["我們用",   "EN · 中 · 日 · DE 撰稿"],
    specBuyers: ["買家",     "僅限通過認證的業者"],
    specOrders: ["訂單",     "聚合式團購"],
    h2Gap: "我們填補的缺口",
    gapP1: "觸達海外獨立車店既昂貴又複雜。最低起訂量、語言障礙和層層代理，在第一個貨出去之前就已經侵蝕掉利潤。",
    gapP2: "Pedaling Forward 把你的零件介紹給一群正在積極尋找更好採購來源的認證車店主、買家和通路商。當興趣夠大，Patisco 就會聚合訂單——讓你達到最低起訂量，不必一家一家去談。",
    h2Benefits: "你能得到什麼",
    b1h: "四語言編輯曝光",
    b1p: "我們用英文、中文、日文、德文撰寫你的產品——測試報告、規格解析、工廠背景，幫助買家真正看懂你的東西。",
    b2h: "需求聚合",
    b2p: "訂單以團購形式進來，不是一次一點。你決定售價、最低起訂量和交期，我們負責買家端。",
    b3h: "只有通過認證的買家",
    b3p: "每位會員都由 Point Asia 團隊審核。你面對的是專業業者——車店主、買家、通路商。",
    b4h: "你主導一切",
    b4p: "你定條件。我們透過 Patisco 促成連結、處理訂單物流。",
    ctaH: "刊登你的產品",
    ctaBtn: "與我們洽談 →",
    ctaFine: "我們對刊登內容有所選擇。如果你的產品值得被認識，歡迎與我們聯絡。",
  },
  ja: {
    eyebrow: "サプライヤー向け",
    headline: "あなたのコンポーネントは、もっと広い舞台に出るべきだ。",
    lead: "何十年もかけてクオリティの高い部品を作ってきた。世界で有名な自転車の中には、あなたのコンポーネントが入っているものもある——ただ、そう言われていないだけだ。",
    body: "世界中の独立系ショップは、見つけられ、確認でき、適切な数量で注文できるなら、あなたの製品を取り扱いたいと思っている。",
    specSet:    ["あなたが決める", "価格・最低発注量・リードタイム"],
    specWrite:  ["執筆言語",       "EN・中・日・DE"],
    specBuyers: ["バイヤー",       "認証済み業者のみ"],
    specOrders: ["注文",           "グループバイ方式"],
    h2Gap: "私たちが埋めるギャップ",
    gapP1: "海外の独立系ショップへのリーチはコストも手間もかかる。最低発注量、言語の壁、流通の層が、最初の1個が出荷される前に利益を食い潰す。",
    gapP2: "Pedaling Forward は、より良い調達先を積極的に探している認証済みのショップオーナー、バイヤー、ディストリビューターにあなたのコンポーネントを紹介する。需要が十分高まると、Patisco が注文を集約する——一軒ずつ交渉しなくても最低発注量を達成できる。",
    h2Benefits: "得られるもの",
    b1h: "4言語での編集露出",
    b1p: "英語・中国語・日本語・ドイツ語であなたの製品を紹介する——テストレポート、スペック解説、工場の背景など、バイヤーが理解するための情報を提供する。",
    b2h: "需要の集約",
    b2p: "注文は少量ずつではなくグループバイとしてまとまって入ってくる。価格・最低発注量・リードタイムはあなたが決める。バイヤー側は私たちが対応する。",
    b3h: "認証済みバイヤーのみ",
    b3p: "すべての会員は Point Asia チームによって審査されている。相手はプロの業者——ショップオーナー、バイヤー、ディストリビューター。",
    b4h: "主導権はあなたに",
    b4p: "条件はあなたが決める。私たちは Patisco を通じてつながりを促進し、注文のロジスティクスを処理する。",
    ctaH: "製品を掲載する",
    ctaBtn: "お問い合わせ →",
    ctaFine: "掲載内容には選択基準があります。製品が紹介に値すると思われる方は、ぜひご連絡ください。",
  },
  de: {
    eyebrow: "Für Lieferanten",
    headline: "Ihre Komponenten verdienen ein breiteres Publikum.",
    lead: "Sie stellen seit Jahrzehnten qualitativ hochwertige Teile her. Einige der bekanntesten Fahrräder der Welt haben Ihre Komponenten — sie sagen es nur nicht.",
    body: "Unabhängige Shops weltweit würden Ihre Produkte führen, wenn sie sie finden, prüfen und in sinnvollen Mengen bestellen könnten.",
    specSet:    ["Sie bestimmen",  "Preis · MOQ · Lieferzeit"],
    specWrite:  ["Wir schreiben in","EN · 中 · 日 · DE"],
    specBuyers: ["Käufer",          "Nur verifizierter Handel"],
    specOrders: ["Bestellungen",    "Aggregiert"],
    h2Gap: "Die Lücke, die wir schließen",
    gapP1: "Unabhängige Shops im Ausland zu erreichen ist teuer und kompliziert. Mindestbestellmengen, Sprachbarrieren und Distributionsebenen fressen die Marge auf, bevor die erste Einheit verschickt wird.",
    gapP2: "Pedaling Forward stellt Ihre Komponenten einem Publikum aus verifizierten Shop-Inhabern, Einkäufern und Distributoren vor, die aktiv nach besseren Bezugsquellen suchen. Wenn das Interesse groß genug ist, bündelt Patisco die Bestellungen — Sie erreichen Ihre MOQ, ohne mit Dutzenden von Shops einzeln zu verhandeln.",
    h2Benefits: "Was Sie bekommen",
    b1h: "Redaktionelle Sichtbarkeit in vier Sprachen",
    b1p: "Wir schreiben über Ihre Produkte auf Englisch, Chinesisch, Japanisch und Deutsch — Testberichte, Spezifikationen und Fabrikkontext, der Käufern hilft zu verstehen, was sie sehen.",
    b2h: "Nachfragebündelung",
    b2p: "Bestellungen kommen als Gruppenbestellung, nicht als Einzelkäufe. Sie legen Preis, MOQ und Lieferzeit fest. Wir kümmern uns um die Käuferseite.",
    b3h: "Nur qualifizierte Käufer",
    b3p: "Jedes Mitglied wird von unserem Team bei Point Asia verifiziert. Sie sprechen mit Handelsprofis — Shop-Inhaber, Einkäufer, Distributoren.",
    b4h: "Sie behalten die Kontrolle",
    b4p: "Sie legen die Bedingungen fest. Wir vermitteln die Verbindung und verwalten die Bestelllogistik über Patisco.",
    ctaH: "Ihre Produkte listen",
    ctaBtn: "Mit uns sprechen →",
    ctaFine: "Wir sind selektiv bei dem, was wir vorstellen. Wenn Ihre Produkte es wert sind, bekannt zu sein, würden wir uns freuen, von Ihnen zu hören.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = { en: "For Suppliers", zh: "供應商專區", ja: "サプライヤー向け", de: "Für Lieferanten" };
  return { title: `${titles[locale] ?? titles.en} — Pedaling Forward` };
}

export default async function SuppliersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = COPY[(locale as Locale)] ?? COPY.en;

  return (
    <>
      <div className="field-ink phead">
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab">{c.eyebrow}</p>
          <h1 className="display">{c.headline}</h1>
          <div className="grid2">
            <p className="lead">{c.lead}</p>
            <p>{c.body}</p>
          </div>
        </div>
      </div>

      <dl className="spec">
        <div><dt>{c.specSet[0]}</dt>    <dd>{c.specSet[1]}</dd></div>
        <div><dt>{c.specWrite[0]}</dt>  <dd>{c.specWrite[1]}</dd></div>
        <div><dt>{c.specBuyers[0]}</dt> <dd>{c.specBuyers[1]}</dd></div>
        <div><dt>{c.specOrders[0]}</dt> <dd>{c.specOrders[1]}</dd></div>
      </dl>

      <section className="wrap tight">
        <h2 className="display" style={{ marginBottom: "30px" }}>{c.h2Gap}</h2>
        <div className="prose">
          <p>{c.gapP1}</p>
          <p>{c.gapP2}</p>
        </div>
      </section>

      <section className="wrap tight" style={{ paddingTop: 0 }}>
        <h2 className="display" style={{ marginBottom: "40px" }}>{c.h2Benefits}</h2>
        <div className="benefits">
          <div className="benefit"><h4>{c.b1h}</h4><p>{c.b1p}</p></div>
          <div className="benefit"><h4>{c.b2h}</h4><p>{c.b2p}</p></div>
          <div className="benefit"><h4>{c.b3h}</h4><p>{c.b3p}</p></div>
          <div className="benefit"><h4>{c.b4h}</h4><p>{c.b4p}</p></div>
        </div>
      </section>

      <div className="wrap">
        <div className="field-red ctablock">
          <h2 className="display">{c.ctaH}</h2>
          <a className="btn on-red" href="#">{c.ctaBtn}</a>
          <p className="fine">{c.ctaFine}</p>
        </div>
      </div>
      <div style={{ height: "80px" }} />
    </>
  );
}
