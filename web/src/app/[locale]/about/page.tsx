import { BrandMark } from "@/components/BrandMark";

type Locale = "en" | "zh" | "ja" | "de";

const COPY: Record<Locale, {
  eyebrow: string; headline: string; lead: string; body: string;
  b1h: string; b1p: string; b2h: string; b2p: string;
  b3h: string; b3p: string; b4h: string; b4p: string;
}> = {
  en: {
    eyebrow: "About",
    headline: "Forty years in the component trade. Now with a website.",
    lead: "Point Asia Co., Ltd. (律寶實業) has been bridging Taiwanese component manufacturers and the global bicycle market since 1983.",
    body: "We speak the factories' language — literally and figuratively — and we've spent four decades learning which ones are worth knowing. Pedaling Forward is where we put that knowledge to work.",
    b1h: "What this site is",
    b1p: "This is our editorial side. Before anyone places an order, they need to know what they're looking at. Pedaling Forward publishes test reports, factory visits, product introductions, and market notes — in English, Chinese, Japanese, and German. All content is free and public. Membership is what gets you into the group buys.",
    b2h: "What Patisco is",
    b2p: "Patisco is our commerce platform. When enough buyers express interest in a product, we open a group buy. Members place their orders through Patisco, pay in their local currency, and receive their stock shipped door-to-door from Taiwan. Patisco handles the purchasing. Pedaling Forward handles the intelligence.",
    b3h: "Who we are",
    b3p: "Point Asia Co., Ltd. was founded in 1983 in Taiwan. We work directly with component manufacturers across the island — brakes, drivetrains, wheels, accessories — and have been connecting them with shops and distributors worldwide for over forty years. Our team reads, writes, and does business in English, Traditional Chinese, Japanese, and German.",
    b4h: "How to reach us",
    b4p: "Point Asia Co., Ltd. (律寶實業), Taiwan.",
  },
  zh: {
    eyebrow: "關於我們",
    headline: "四十年零件貿易，現在有了一個網站。",
    lead: "律寶實業（Point Asia Co., Ltd.）自 1983 年起，持續連結台灣零件製造商與全球自行車市場。",
    body: "我們說得懂工廠的語言——字面上和實質上都是。四十年來，我們一直在學習哪些廠商值得認識。Pedaling Forward 是我們把這些知識付諸行動的地方。",
    b1h: "這個網站是什麼",
    b1p: "這是我們的編輯端。在任何人下訂單之前，他們需要先了解自己在看什麼。Pedaling Forward 以英文、中文、日文、德文發布測試報告、工廠參訪、產品介紹和市場觀察。所有內容免費公開。會員資格才能參與團購。",
    b2h: "Patisco 是什麼",
    b2p: "Patisco 是我們的商務平台。當有足夠多的買家對某項產品表達興趣，我們就開放團購。會員透過 Patisco 下單，以當地幣別付款，貨品從台灣直送到府。Patisco 負責採購，Pedaling Forward 負責情報。",
    b3h: "我們是誰",
    b3p: "律寶實業於 1983 年在台灣創立。我們直接與全島的零件製造商合作——煞車、傳動、輪組、配件——四十多年來持續將他們與全球的車店及通路商連結起來。我們的團隊以英文、繁體中文、日文和德文閱讀、撰寫、做生意。",
    b4h: "如何聯絡我們",
    b4p: "律寶實業（Point Asia Co., Ltd.），台灣。",
  },
  ja: {
    eyebrow: "私たちについて",
    headline: "コンポーネント取引40年。ついにウェブサイトを開設。",
    lead: "Point Asia Co., Ltd.（律寶實業）は1983年から、台湾のコンポーネントメーカーと世界の自転車市場をつなぎ続けてきた。",
    body: "私たちは工場の言葉を、文字通りにも実質的にも話せる。どの工場が付き合う価値があるかを40年かけて学んできた。Pedaling Forward はその知識を活かす場だ。",
    b1h: "このサイトとは",
    b1p: "これは私たちの編集部門だ。誰かが注文を出す前に、自分が何を見ているかを知る必要がある。Pedaling Forward は英語・中国語・日本語・ドイツ語でテストレポート、工場訪問、製品紹介、マーケットノートを発行している。すべてのコンテンツは無料公開。グループバイへの参加には会員資格が必要。",
    b2h: "Patisco とは",
    b2p: "Patisco は私たちのコマースプラットフォームだ。十分なバイヤーが製品に興味を表明すると、グループバイが始まる。会員は Patisco を通じて注文し、現地通貨で支払い、台湾からドアツードアで在庫を受け取る。Patisco が購買を担い、Pedaling Forward がインテリジェンスを担う。",
    b3h: "私たちとは",
    b3p: "Point Asia Co., Ltd. は1983年に台湾で設立された。島全体のコンポーネントメーカー——ブレーキ、ドライブトレイン、ホイール、アクセサリー——と直接取引し、40年以上にわたって世界のショップやディストリビューターとつなぎ続けてきた。チームは英語・繁体字中国語・日本語・ドイツ語で読み、書き、ビジネスをおこなっている。",
    b4h: "お問い合わせ",
    b4p: "Point Asia Co., Ltd.（律寶實業）、台湾。",
  },
  de: {
    eyebrow: "Über uns",
    headline: "Vierzig Jahre im Komponentenhandel. Jetzt mit einer Website.",
    lead: "Point Asia Co., Ltd. (律寶實業) verbindet seit 1983 taiwanesische Komponentenhersteller mit dem globalen Fahrradmarkt.",
    body: "Wir sprechen die Sprache der Fabriken — im wörtlichen und übertragenen Sinne — und haben vier Jahrzehnte damit verbracht zu lernen, welche es wert sind zu kennen. Pedaling Forward ist der Ort, an dem wir dieses Wissen einsetzen.",
    b1h: "Was diese Website ist",
    b1p: "Dies ist unsere redaktionelle Seite. Bevor jemand eine Bestellung aufgibt, muss er wissen, was er sich ansieht. Pedaling Forward veröffentlicht Testberichte, Fabrikbesuche, Produktvorstellungen und Marktnotizen — auf Englisch, Chinesisch, Japanisch und Deutsch. Alle Inhalte sind kostenlos und öffentlich. Die Mitgliedschaft ermöglicht den Zugang zu Gruppenbestellungen.",
    b2h: "Was Patisco ist",
    b2p: "Patisco ist unsere Handelsplattform. Wenn genug Käufer Interesse an einem Produkt bekunden, öffnen wir eine Gruppenbestellung. Mitglieder geben ihre Bestellungen über Patisco auf, zahlen in ihrer Landeswährung und erhalten ihre Ware per Haustürlieferung aus Taiwan. Patisco übernimmt den Kauf. Pedaling Forward übernimmt die Informationsarbeit.",
    b3h: "Wer wir sind",
    b3p: "Point Asia Co., Ltd. wurde 1983 in Taiwan gegründet. Wir arbeiten direkt mit Komponentenherstellern auf der ganzen Insel — Bremsen, Antriebe, Räder, Zubehör — und verbinden sie seit über vierzig Jahren mit Shops und Distributoren weltweit. Unser Team liest, schreibt und macht Geschäfte auf Englisch, Traditionellem Chinesisch, Japanisch und Deutsch.",
    b4h: "Kontakt",
    b4p: "Point Asia Co., Ltd. (律寶實業), Taiwan.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = { en: "About", zh: "關於我們", ja: "私たちについて", de: "Über uns" };
  return { title: `${titles[locale] ?? titles.en} — Pedaling Forward` };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
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

      <section className="wrap tight">
        <div className="benefits">
          <div className="benefit">
            <h4>{c.b1h}</h4>
            <p style={{ maxWidth: "none" }}>{c.b1p}</p>
          </div>
          <div className="benefit">
            <h4>{c.b2h}</h4>
            <p style={{ maxWidth: "none" }}>{c.b2p}</p>
          </div>
          <div className="benefit">
            <h4>{c.b3h}</h4>
            <p style={{ maxWidth: "none" }}>{c.b3p}</p>
          </div>
          <div className="benefit">
            <h4>{c.b4h}</h4>
            <p style={{ maxWidth: "none" }}>{c.b4p} <span style={{ color: "#D5352A" }}>[聯絡表單 — 即將推出]</span></p>
          </div>
        </div>
      </section>
      <div style={{ height: "80px" }} />
    </>
  );
}
