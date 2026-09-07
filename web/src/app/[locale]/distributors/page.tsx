import { BrandMark } from "@/components/BrandMark";

type Locale = "en" | "zh" | "ja" | "de";

const COPY: Record<Locale, {
  eyebrow: string; headline: string; lead: string; body: string;
  h2Changes: string; chP1: string; chP2: string;
  h2Benefits: string;
  b1h: string; b1p: string; b2h: string; b2p: string; b3h: string; b3p: string; b4h: string; b4p: string;
  ctaH: string; ctaBtn: string; ctaFine: string;
}> = {
  en: {
    eyebrow: "For distributors",
    headline: "Better products. Better margin. Less guesswork.",
    lead: "You know what your retailers want. They're asking for more variety, better quality, and margins that make sense.",
    body: "The answer is usually somewhere in Taiwan — the question is how to get there without adding another layer in the middle.",
    h2Changes: "What changes",
    chP1: "Pedaling Forward connects you directly to verified Taiwan suppliers. Group buys on Patisco let you consolidate orders from your retailers into a single purchase — hitting the minimum quantity without carrying the inventory risk alone.",
    chP2: "Payment is local. Delivery is door-to-door. No freight forwarding, no customs brokerage on your end.",
    h2Benefits: "What you get",
    b1h: "Direct Taiwan supplier access",
    b1p: "Relationships built over 40 years of component trade — vetted, reliable, and ready to work with overseas distributors.",
    b2h: "Consolidated ordering",
    b2p: "Aggregate your retailers' demand into one group buy. One shipment, one payment, one contact.",
    b3h: "Better margin",
    b3p: "Fewer hands between the factory and your warehouse. The math works differently when you buy closer to the source.",
    b4h: "Pay locally, receive door-to-door",
    b4p: "Patisco handles the transaction in your local currency. Your stock ships direct from Taiwan to your door.",
    ctaH: "Apply as a distributor",
    ctaBtn: "Start the application →",
    ctaFine: "Applications are reviewed by our team at Point Asia.",
  },
  zh: {
    eyebrow: "通路商專區",
    headline: "更好的產品。更好的利潤。更少的猜測。",
    lead: "你知道你的零售商要什麼。他們要更多選擇、更好的品質，還有合理的利潤空間。",
    body: "答案通常就在台灣——問題是如何在不增加中間層的情況下取得。",
    h2Changes: "改變了什麼",
    chP1: "Pedaling Forward 直接把你與通過認證的台灣供應商連結起來。Patisco 上的團購讓你把零售商的需求整合成一筆採購——達到最低起訂量，不必獨自承擔庫存風險。",
    chP2: "當地幣別付款。直送到府。不需要自行安排貨運或辦理通關。",
    h2Benefits: "你能得到什麼",
    b1h: "直接接觸台灣供應商",
    b1p: "Point Asia 40 年零件貿易累積的合作關係——可靠、經過驗證，且準備好與海外通路商合作。",
    b2h: "整合訂購",
    b2p: "把零售商的需求聚合成一次團購。一批貨、一筆付款、一個聯絡窗口。",
    b3h: "更好的利潤",
    b3p: "工廠到你倉庫之間的中間層更少。買得越接近源頭，帳就算得越漂亮。",
    b4h: "當地幣別付款，直送到府",
    b4p: "Patisco 以你的當地幣別處理付款。貨品從台灣直送到你的門口。",
    ctaH: "申請成為通路商",
    ctaBtn: "開始申請 →",
    ctaFine: "申請由 Point Asia 團隊審核。",
  },
  ja: {
    eyebrow: "ディストリビューター向け",
    headline: "より良い製品。より良い利益。より少ない不確実性。",
    lead: "小売店が何を求めているかはわかっている。より多様な選択肢、より高い品質、そして納得できる利幅だ。",
    body: "答えはたいてい台湾にある——問題は、中間層を増やさずにそこへたどり着く方法だ。",
    h2Changes: "何が変わるか",
    chP1: "Pedaling Forward があなたを認証済みの台湾サプライヤーと直接つなぐ。Patisco のグループバイで小売店の需要を1回の仕入れにまとめられる——在庫リスクを単独で抱えることなく最低発注量を達成できる。",
    chP2: "支払いは現地通貨。配送はドアツードア。貨物輸送の手配も通関手続きも不要。",
    h2Benefits: "得られるもの",
    b1h: "台湾サプライヤーへの直接アクセス",
    b1p: "40年のコンポーネント取引で築いた関係——審査済み、信頼できる、海外ディストリビューターと連携する準備ができている。",
    b2h: "注文の一本化",
    b2p: "小売店の需要を1回のグループバイにまとめる。1回の出荷、1回の支払い、1つの窓口。",
    b3h: "より良い利益",
    b3p: "工場からあなたの倉庫までの中間業者が減る。ソースに近いところで買えば、計算が変わる。",
    b4h: "現地払い・ドアツードア配送",
    b4p: "Patisco が現地通貨で取引を処理する。台湾から直接ドアまで配送。",
    ctaH: "ディストリビューターとして申し込む",
    ctaBtn: "申し込みを始める →",
    ctaFine: "申請は Point Asia チームが審査します。",
  },
  de: {
    eyebrow: "Für Händler",
    headline: "Bessere Produkte. Bessere Marge. Weniger Rätselraten.",
    lead: "Sie wissen, was Ihre Händler wollen. Sie fordern mehr Auswahl, bessere Qualität und Margen, die Sinn ergeben.",
    body: "Die Antwort liegt meistens irgendwo in Taiwan — die Frage ist, wie man dort hinkommt, ohne eine weitere Zwischenstufe einzufügen.",
    h2Changes: "Was sich ändert",
    chP1: "Pedaling Forward verbindet Sie direkt mit verifizierten Taiwan-Lieferanten. Gruppenbestellungen auf Patisco ermöglichen es Ihnen, die Bestellungen Ihrer Händler in einem einzigen Kauf zu bündeln — ohne das Lagerrisiko alleine zu tragen.",
    chP2: "Zahlung in lokaler Währung. Haustürlieferung. Keine Spedition, keine Zollabfertigung Ihrerseits.",
    h2Benefits: "Was Sie bekommen",
    b1h: "Direkter Zugang zu Taiwan-Lieferanten",
    b1p: "Beziehungen aus über 40 Jahren Komponentenhandel — geprüft, zuverlässig und bereit für die Zusammenarbeit mit Übersee-Distributoren.",
    b2h: "Konsolidierte Bestellung",
    b2p: "Bündeln Sie die Nachfrage Ihrer Händler in einer Gruppenbestellung. Eine Lieferung, eine Zahlung, ein Ansprechpartner.",
    b3h: "Bessere Marge",
    b3p: "Weniger Hände zwischen Fabrik und Ihrem Lager. Die Rechnung geht anders auf, wenn Sie näher an der Quelle kaufen.",
    b4h: "Lokal zahlen, Haustürlieferung",
    b4p: "Patisco wickelt die Transaktion in Ihrer Landeswährung ab. Ihre Ware wird direkt aus Taiwan geliefert.",
    ctaH: "Als Händler bewerben",
    ctaBtn: "Bewerbung starten →",
    ctaFine: "Bewerbungen werden von unserem Team bei Point Asia geprüft.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = { en: "For Distributors", zh: "通路商專區", ja: "ディストリビューター向け", de: "Für Händler" };
  return { title: `${titles[locale] ?? titles.en} — Pedaling Forward` };
}

export default async function DistributorsPage({ params }: { params: Promise<{ locale: string }> }) {
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
        <h2 className="display" style={{ marginBottom: "30px" }}>{c.h2Changes}</h2>
        <div className="prose">
          <p>{c.chP1}</p>
          <p>{c.chP2}</p>
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
