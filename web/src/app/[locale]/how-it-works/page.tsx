import { BrandMark } from "@/components/BrandMark";

type Locale = "en" | "zh" | "ja" | "de";

const COPY: Record<Locale, {
  eyebrow: string; headline: string;
  s1h: string; s1p: string; s2h: string; s2p: string; s3h: string; s3p: string;
  s4h: string; s4p: string; s5h: string; s5p: string;
  note: string;
}> = {
  en: {
    eyebrow: "How it works",
    headline: "From Taiwan factory to your shop floor.",
    s1h: "Read",
    s1p: "Pedaling Forward publishes test reports, product introductions, factory visits, and market notes. All content is free and public — no account required.",
    s2h: "Join",
    s2p: "Apply for a free membership. Our team at Point Asia Co., Ltd. reviews every application personally. We're looking for shop owners, buyers, mechanics, and distributors who work professionally with bicycle components.",
    s3h: "Express interest",
    s3p: "See a product worth carrying? Hit \"Express Interest.\" When enough members flag the same product, we know there's real demand — and we go to work on the supplier side.",
    s4h: "Group buy opens",
    s4p: "When demand is confirmed, a group buy opens on Patisco. You'll see the price, the minimum quantity, and the lead time. No obligation — you decide if it works for your business.",
    s5h: "Order and receive",
    s5p: "Place your order on Patisco. Pay in your local currency. Your stock ships door-to-door from Taiwan.",
    note: "Articles are free and public. Group buy participation requires a free membership. All applications are reviewed by our team.",
  },
  zh: {
    eyebrow: "如何運作",
    headline: "從台灣工廠到你的店面。",
    s1h: "閱讀",
    s1p: "Pedaling Forward 發布測試報告、產品介紹、工廠參訪記錄與市場觀察。所有內容免費公開，不需帳號。",
    s2h: "加入",
    s2p: "申請免費會員資格。律寶實業（Point Asia Co., Ltd.）的團隊會親自審核每一份申請。我們尋找的是以自行車零件為業的車店主、採購人員、技師和通路商。",
    s3h: "表達興趣",
    s3p: "看到值得引進的產品？按下「表達興趣」。當足夠多的會員標記同一件產品，我們就知道有真實需求——然後去供應商那邊談。",
    s4h: "團購開跑",
    s4p: "需求確認後，Patisco 上的團購正式開放。你會看到售價、最低起訂量和交期。沒有任何義務——由你決定是否適合你的生意。",
    s5h: "下單收貨",
    s5p: "在 Patisco 下單。以當地幣別付款。貨品從台灣直送到你的門口。",
    note: "文章免費公開。參與團購需要免費會員資格。所有申請均由我們的團隊審核。",
  },
  ja: {
    eyebrow: "仕組み",
    headline: "台湾の工場から、あなたのショップへ。",
    s1h: "読む",
    s1p: "Pedaling Forward はテストレポート、製品紹介、工場訪問、マーケットノートを発行している。すべてのコンテンツは無料公開でアカウント不要。",
    s2h: "参加する",
    s2p: "無料の会員資格に申し込む。Point Asia Co., Ltd. のチームが申請を個別に審査する。対象は自転車コンポーネントを職業として扱うショップオーナー、バイヤー、メカニック、ディストリビューター。",
    s3h: "興味を表明する",
    s3p: "取り扱いたい製品を見つけたら「興味を表明」を押す。十分な数の会員が同じ製品にフラグを立てると、本物の需要があると判断し、サプライヤー側との交渉を開始する。",
    s4h: "グループバイが始まる",
    s4p: "需要が確認されると、Patisco でグループバイが公開される。価格、最低発注量、リードタイムが表示される。義務はない——自分のビジネスに合うかどうかを判断できる。",
    s5h: "注文して受け取る",
    s5p: "Patisco で注文する。現地通貨で支払う。台湾からドアツードアで配送される。",
    note: "記事は無料公開。グループバイへの参加には無料会員資格が必要。すべての申請はチームが審査する。",
  },
  de: {
    eyebrow: "So funktioniert's",
    headline: "Von der taiwanesischen Fabrik auf Ihren Ladenboden.",
    s1h: "Lesen",
    s1p: "Pedaling Forward veröffentlicht Testberichte, Produktvorstellungen, Fabrikbesuche und Marktnotizen. Alle Inhalte sind kostenlos und öffentlich — kein Konto erforderlich.",
    s2h: "Beitreten",
    s2p: "Bewerben Sie sich für eine kostenlose Mitgliedschaft. Unser Team bei Point Asia Co., Ltd. prüft jeden Antrag persönlich. Wir suchen Shop-Inhaber, Einkäufer, Mechaniker und Distributoren, die professionell mit Fahrradkomponenten arbeiten.",
    s3h: "Interesse bekunden",
    s3p: "Sehen Sie ein Produkt, das sich lohnt? Klicken Sie auf \"Interesse bekunden\". Wenn genug Mitglieder dasselbe Produkt markieren, wissen wir, dass echte Nachfrage besteht — und wir gehen auf die Lieferantenseite zu.",
    s4h: "Gruppenbestellung startet",
    s4p: "Wenn die Nachfrage bestätigt ist, öffnet eine Gruppenbestellung auf Patisco. Sie sehen Preis, Mindestabnahmemenge und Lieferzeit. Keine Verpflichtung — Sie entscheiden, ob es für Ihr Geschäft passt.",
    s5h: "Bestellen und empfangen",
    s5p: "Geben Sie Ihre Bestellung auf Patisco auf. Zahlen Sie in Ihrer Landeswährung. Ihre Ware wird direkt aus Taiwan geliefert.",
    note: "Artikel sind kostenlos und öffentlich. Die Teilnahme an Gruppenbestellungen erfordert eine kostenlose Mitgliedschaft. Alle Anträge werden von unserem Team geprüft.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = { en: "How It Works", zh: "如何運作", ja: "仕組み", de: "So funktioniert's" };
  return { title: `${titles[locale] ?? titles.en} — Pedaling Forward` };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = COPY[(locale as Locale)] ?? COPY.en;

  return (
    <>
      <div className="field-red phead">
        <div className="mark" aria-hidden="true"><BrandMark /></div>
        <div className="wrap">
          <p className="lab" style={{ color: "rgba(255,255,255,.82)" }}>{c.eyebrow}</p>
          <h1 className="display">{c.headline}</h1>
        </div>
      </div>

      <section className="wrap">
        <div className="steps rowy">
          <div className="step"><div className="num">01</div><div><h4>{c.s1h}</h4><p>{c.s1p}</p></div></div>
          <div className="step"><div className="num">02</div><div><h4>{c.s2h}</h4><p>{c.s2p}</p></div></div>
          <div className="step"><div className="num">03</div><div><h4>{c.s3h}</h4><p>{c.s3p}</p></div></div>
          <div className="step"><div className="num">04</div><div><h4>{c.s4h}</h4><p>{c.s4p}</p></div></div>
          <div className="step"><div className="num">05</div><div><h4>{c.s5h}</h4><p>{c.s5p}</p></div></div>
        </div>
        <p className="lab dim" style={{ marginTop: "34px", letterSpacing: ".08em", lineHeight: "1.9", maxWidth: "74ch", textTransform: "none" }}>
          {c.note}
        </p>
      </section>
    </>
  );
}
