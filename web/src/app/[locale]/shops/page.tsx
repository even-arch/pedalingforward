import { BrandMark } from "@/components/BrandMark";

type Locale = "en" | "zh" | "ja" | "de";

const COPY: Record<Locale, {
  eyebrow: string; headline: string; lead: string; body: string;
  specMembership: [string, string]; specApply: [string, string]; specArticles: [string, string]; specPayment: [string, string]; specDelivery: [string, string];
  h2Benefits: string;
  b1h: string; b1p: string; b2h: string; b2p: string; b3h: string; b3p: string; b4h: string; b4p: string;
  h2Steps: string;
  s1h: string; s1p: string; s2h: string; s2p: string; s3h: string; s3p: string; s4h: string; s4p: string; s5h: string; s5p: string;
  ctaH: string; ctaBtn: string; ctaFine: string;
}> = {
  en: {
    eyebrow: "For bike shops",
    headline: "Carry components you can actually stand behind.",
    lead: "You've spent years building trust with your customers. The last thing you want is to sell them something that fails — and already know where it came from.",
    body: "Taiwan's component manufacturers have been supplying the world's best bikes for decades. The problem has never been quality. It's been access.",
    specMembership: ["Membership", "Free"],
    specApply:     ["To apply",   "Company + email"],
    specArticles:  ["Articles",   "Open to all"],
    specPayment:   ["Payment",    "Local currency"],
    specDelivery:  ["Delivery",   "Door to door"],
    h2Benefits: "What you get",
    b1h: "Verified Taiwan components, properly explained",
    b1p: "Test reports and product introductions before you commit to any stock. Know exactly what you're buying and who makes it.",
    b2h: "Early access to group buys",
    b2p: "Members see new group buys before they open. Express interest early — we'll notify you when the order is live on Patisco.",
    b3h: "Direct Taiwan pricing",
    b3p: "No sub-distributors, no inflated catalog prices. Group buys aggregate your order with other shops so you hit the minimum quantity without buying more than you need.",
    b4h: "Door-to-door delivery, pay locally",
    b4p: "Your stock ships from Taiwan direct to your door. Payment is handled in your local currency through Patisco.",
    h2Steps: "How it works for shops",
    s1h: "Read",  s1p: "Test reports, product introductions, factory stories. Free and public, no account needed.",
    s2h: "Apply", s2p: "Membership is free. Our team at Point Asia reviews every application.",
    s3h: "Express interest", s3p: "Flag the products you'd like to carry.",
    s4h: "Group buy opens",  s4p: "When demand is confirmed, the order goes live on Patisco.",
    s5h: "Order & receive",  s5p: "Order, pay locally, and receive your stock.",
    ctaH: "Apply as a shop member",
    ctaBtn: "Start the application →",
    ctaFine: "Membership is free. Applications are reviewed by our team at Point Asia.",
  },
  zh: {
    eyebrow: "車店專區",
    headline: "為客人挑選真正說得過去的零件。",
    lead: "你花了多年建立客人的信任。最不想發生的事，是把你自己也清楚問題出在哪的產品賣給他們。",
    body: "台灣零件廠商供應全球頂尖自行車已有數十年。問題從來不在品質，在於如何取得。",
    specMembership: ["會員資格", "免費"],
    specApply:     ["申請需要",  "公司名稱 + 信箱"],
    specArticles:  ["文章",      "全部公開"],
    specPayment:   ["付款",      "當地幣別"],
    specDelivery:  ["配送",      "直送到府"],
    h2Benefits: "你能得到什麼",
    b1h: "有詳細說明的台灣認證零件",
    b1p: "購貨前先看測試報告和產品介紹。清楚知道你買的是什麼、誰製造的。",
    b2h: "早一步取得團購資訊",
    b2p: "會員比公開開放前更早看到新團購。提前表達興趣——訂單在 Patisco 上線時我們會通知你。",
    b3h: "台灣直接報價",
    b3p: "沒有子代理、沒有虛高目錄價。團購把你的訂單與其他車店合併，達到最低起訂量，不必多買。",
    b4h: "直送到府，當地幣別付款",
    b4p: "貨品從台灣直送你的門口。透過 Patisco 以當地幣別付款。",
    h2Steps: "車店操作流程",
    s1h: "閱讀",     s1p: "測試報告、產品介紹、工廠故事。免費公開，不需帳號。",
    s2h: "申請",     s2p: "會員資格免費。Point Asia 團隊審核每份申請。",
    s3h: "表達興趣", s3p: "標記你想引進的產品。",
    s4h: "團購開跑", s4p: "需求確認後，訂單在 Patisco 上線。",
    s5h: "下單收貨", s5p: "下單、當地付款、收到貨品。",
    ctaH: "申請車店會員",
    ctaBtn: "開始申請 →",
    ctaFine: "會員資格免費。申請由 Point Asia 團隊審核。",
  },
  ja: {
    eyebrow: "ショップ向け",
    headline: "自信を持って薦められるコンポーネントを仕入れる。",
    lead: "長年かけてお客様との信頼を築いてきた。問題があるとわかりながら、それを売りたい人はいない。",
    body: "台湾のコンポーネントメーカーは、何十年も世界最高の自転車に部品を供給してきた。問題は品質ではない。アクセスだ。",
    specMembership: ["会員資格", "無料"],
    specApply:     ["申し込みに必要", "会社名 ＋ メール"],
    specArticles:  ["記事",          "全公開"],
    specPayment:   ["支払い",        "現地通貨"],
    specDelivery:  ["配送",          "ドアツードア"],
    h2Benefits: "得られるもの",
    b1h: "詳しい説明つきの検証済み台湾コンポ",
    b1p: "仕入れを決める前にテストレポートと製品紹介を確認できる。何を買うのか、誰が作ったのかを正確に把握できる。",
    b2h: "グループバイへの優先アクセス",
    b2p: "会員は公開前に新しいグループバイを確認できる。早めに興味を表明すれば、注文が Patisco に公開された際に通知が届く。",
    b3h: "台湾直接価格",
    b3p: "サブディストリビューターなし、割増カタログ価格なし。グループバイで他のショップと注文をまとめることで、余剰在庫を抱えずに最低発注数量を達成できる。",
    b4h: "ドアツードア配送・現地通貨払い",
    b4p: "台湾から直接お店まで配送。支払いは Patisco 経由で現地通貨で対応。",
    h2Steps: "ショップの流れ",
    s1h: "読む",       s1p: "テストレポート、製品紹介、工場ストーリー。無料公開でアカウント不要。",
    s2h: "申し込む",   s2p: "会員資格は無料。Point Asia チームが申請を個別に審査。",
    s3h: "興味を表明", s3p: "取り扱いたい製品をフラグ。",
    s4h: "グループバイ開始", s4p: "需要が確認されたら Patisco で注文が公開される。",
    s5h: "注文・受け取り",   s5p: "注文、現地払い、商品受け取り。",
    ctaH: "ショップ会員として申し込む",
    ctaBtn: "申し込みを始める →",
    ctaFine: "会員資格は無料。申請は Point Asia チームが審査します。",
  },
  de: {
    eyebrow: "Für Shops",
    headline: "Komponenten, für die Sie wirklich einstehen können.",
    lead: "Sie haben jahrelang das Vertrauen Ihrer Kunden aufgebaut. Das Letzte, was Sie wollen, ist, ihnen etwas zu verkaufen, das versagt.",
    body: "Taiwanesische Komponentenhersteller beliefern seit Jahrzehnten die besten Fahrräder der Welt. Das Problem war nie die Qualität. Es war der Zugang.",
    specMembership: ["Mitgliedschaft", "Kostenlos"],
    specApply:     ["Für die Bewerbung", "Firma + E-Mail"],
    specArticles:  ["Artikel",           "Öffentlich"],
    specPayment:   ["Zahlung",           "Lokale Währung"],
    specDelivery:  ["Lieferung",         "Haustürlieferung"],
    h2Benefits: "Was Sie bekommen",
    b1h: "Verifizierte Taiwan-Komponenten, verständlich erklärt",
    b1p: "Testberichte und Produktvorstellungen, bevor Sie Lagerware bestellen. Wissen Sie genau, was Sie kaufen und wer es herstellt.",
    b2h: "Früher Zugang zu Gruppenbestellungen",
    b2p: "Mitglieder sehen neue Gruppenbestellungen vor der öffentlichen Freigabe. Frühzeitig Interesse bekunden — wir benachrichtigen Sie, wenn die Bestellung auf Patisco live geht.",
    b3h: "Direktpreise aus Taiwan",
    b3p: "Keine Zwischenhändler, keine überhöhten Katalogpreise. Gruppenbestellungen bündeln Ihre Bestellung mit anderen Shops.",
    b4h: "Haustürlieferung, lokale Währung",
    b4p: "Ihre Ware wird direkt aus Taiwan geliefert. Zahlung in Ihrer Landeswährung über Patisco.",
    h2Steps: "So funktioniert es für Shops",
    s1h: "Lesen",              s1p: "Testberichte, Produktvorstellungen, Werkstattgeschichten. Kostenlos, kein Konto erforderlich.",
    s2h: "Bewerben",           s2p: "Mitgliedschaft kostenlos. Unser Team bei Point Asia prüft jeden Antrag.",
    s3h: "Interesse bekunden", s3p: "Markieren Sie die Produkte, die Sie führen möchten.",
    s4h: "Gruppenbestellung",  s4p: "Wenn die Nachfrage bestätigt ist, geht die Bestellung auf Patisco live.",
    s5h: "Bestellen & empfangen", s5p: "Bestellen, lokal bezahlen und Ihre Ware empfangen.",
    ctaH: "Als Shop-Mitglied bewerben",
    ctaBtn: "Bewerbung starten →",
    ctaFine: "Mitgliedschaft kostenlos. Bewerbungen werden von unserem Team bei Point Asia geprüft.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = { en: "For Bike Shops", zh: "車店專區", ja: "ショップ向け", de: "Für Shops" };
  return { title: `${titles[locale] ?? titles.en} — Pedaling Forward` };
}

export default async function ShopsPage({ params }: { params: Promise<{ locale: string }> }) {
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
        <div><dt>{c.specMembership[0]}</dt><dd>{c.specMembership[1]}</dd></div>
        <div><dt>{c.specApply[0]}</dt>    <dd>{c.specApply[1]}</dd></div>
        <div><dt>{c.specArticles[0]}</dt> <dd>{c.specArticles[1]}</dd></div>
        <div><dt>{c.specPayment[0]}</dt>  <dd>{c.specPayment[1]}</dd></div>
        <div><dt>{c.specDelivery[0]}</dt> <dd>{c.specDelivery[1]}</dd></div>
      </dl>

      <section className="wrap tight">
        <h2 className="display" style={{ marginBottom: "40px" }}>{c.h2Benefits}</h2>
        <div className="benefits">
          <div className="benefit"><h4>{c.b1h}</h4><p>{c.b1p}</p></div>
          <div className="benefit"><h4>{c.b2h}</h4><p>{c.b2p}</p></div>
          <div className="benefit"><h4>{c.b3h}</h4><p>{c.b3p}</p></div>
          <div className="benefit"><h4>{c.b4h}</h4><p>{c.b4p}</p></div>
        </div>
      </section>

      <section className="wrap tight" style={{ paddingTop: 0 }}>
        <h2 className="display" style={{ marginBottom: "36px" }}>{c.h2Steps}</h2>
        <div className="steps">
          <div className="step"><div className="num">01</div><h4>{c.s1h}</h4><p>{c.s1p}</p></div>
          <div className="step"><div className="num">02</div><h4>{c.s2h}</h4><p>{c.s2p}</p></div>
          <div className="step"><div className="num">03</div><h4>{c.s3h}</h4><p>{c.s3p}</p></div>
          <div className="step"><div className="num">04</div><h4>{c.s4h}</h4><p>{c.s4p}</p></div>
          <div className="step"><div className="num">05</div><h4>{c.s5h}</h4><p>{c.s5p}</p></div>
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
