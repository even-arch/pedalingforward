type LS = { en: string; zh: string; ja: string; de: string };
type LT = LS;
const ls = (en: string, zh: string, ja: string, de: string): LS => ({ en, zh, ja, de });
const lt = (en: string, zh: string, ja: string, de: string): LT => ({ en, zh, ja, de });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const STATIC_PAGE_DEFAULTS: Record<string, any> = {
  shops: {
    slug: "shops",
    heroStyle: "dark",
    heroEyebrow: ls("For bike shops", "車店專區", "ショップ向け", "Für Shops"),
    heroHeadline: ls("Carry components you can actually stand behind.", "為客人挑選真正說得過去的零件。", "自信を持って薦められるコンポーネントを仕入れる。", "Komponenten, für die Sie wirklich einstehen können."),
    heroLead: lt("You've spent years building trust with your customers. The last thing you want is to sell them something that fails — and already know where it came from.", "你花了多年建立客人的信任。最不想發生的事，是把你自己也清楚問題出在哪的產品賣給他們。", "長年かけてお客様との信頼を築いてきた。問題があるとわかりながら、それを売りたい人はいない。", "Sie haben jahrelang das Vertrauen Ihrer Kunden aufgebaut. Das Letzte, was Sie wollen, ist, ihnen etwas zu verkaufen, das versagt."),
    heroBody: lt("Taiwan's component manufacturers have been supplying the world's best bikes for decades. The problem has never been quality. It's been access.", "台灣零件廠商供應全球頂尖自行車已有數十年。問題從來不在品質，在於如何取得。", "台湾のコンポーネントメーカーは、何十年も世界最高の自転車に部品を供給してきた。問題は品質ではない。アクセスだ。", "Taiwanesische Komponentenhersteller beliefern seit Jahrzehnten die besten Fahrräder der Welt. Das Problem war nie die Qualität. Es war der Zugang."),
    specItems: [
      { _key: "s1", label: ls("Membership","會員資格","会員資格","Mitgliedschaft"), value: ls("Free","免費","無料","Kostenlos") },
      { _key: "s2", label: ls("To apply","申請需要","申し込みに必要","Für die Bewerbung"), value: ls("Company + email","公司名稱 + 信箱","会社名 ＋ メール","Firma + E-Mail") },
      { _key: "s3", label: ls("Articles","文章","記事","Artikel"), value: ls("Open to all","全部公開","全公開","Öffentlich") },
      { _key: "s4", label: ls("Payment","付款","支払い","Zahlung"), value: ls("Local currency","當地幣別","現地通貨","Lokale Währung") },
      { _key: "s5", label: ls("Delivery","配送","配送","Lieferung"), value: ls("Door to door","直送到府","ドアツードア","Haustürlieferung") },
    ],
    sections: [
      { _key: "benefits", _type: "benefitsSection", heading: ls("What you get","你能得到什麼","得られるもの","Was Sie bekommen"), items: [
        { _key: "b1", title: ls("Verified Taiwan components, properly explained","有詳細說明的台灣認證零件","詳しい説明つきの検証済み台湾コンポ","Verifizierte Taiwan-Komponenten, verständlich erklärt"), body: lt("Test reports and product introductions before you commit to any stock. Know exactly what you're buying and who makes it.","購貨前先看測試報告和產品介紹。清楚知道你買的是什麼、誰製造的。","仕入れを決める前にテストレポートと製品紹介を確認できる。","Testberichte und Produktvorstellungen, bevor Sie Lagerware bestellen.") },
        { _key: "b2", title: ls("Early access to group buys","早一步取得團購資訊","グループバイへの優先アクセス","Früher Zugang zu Gruppenbestellungen"), body: lt("Members see new group buys before they open. Express interest early — we'll notify you when the order is live on Patisco.","會員比公開開放前更早看到新團購。提前表達興趣——訂單在 Patisco 上線時我們會通知你。","会員は公開前に新しいグループバイを確認できる。","Mitglieder sehen neue Gruppenbestellungen vor der öffentlichen Freigabe.") },
        { _key: "b3", title: ls("Direct Taiwan pricing","台灣直接報價","台湾直接価格","Direktpreise aus Taiwan"), body: lt("No sub-distributors, no inflated catalog prices. Group buys aggregate your order with other shops so you hit the minimum quantity without buying more than you need.","沒有子代理、沒有虛高目錄價。團購把你的訂單與其他車店合併，達到最低起訂量，不必多買。","サブディストリビューターなし、割増カタログ価格なし。","Keine Zwischenhändler, keine überhöhten Katalogpreise.") },
        { _key: "b4", title: ls("Door-to-door delivery, pay locally","直送到府，當地幣別付款","ドアツードア配送・現地通貨払い","Haustürlieferung, lokale Währung"), body: lt("Your stock ships from Taiwan direct to your door. Payment is handled in your local currency through Patisco.","貨品從台灣直送你的門口。透過 Patisco 以當地幣別付款。","台湾から直接お店まで配送。","Ihre Ware wird direkt aus Taiwan geliefert.") },
      ]},
      { _key: "steps", _type: "stepsSection", heading: ls("How it works for shops","車店操作流程","ショップの流れ","So funktioniert es für Shops"), items: [
        { _key: "st1", title: ls("Read","閱讀","読む","Lesen"), body: lt("Test reports, product introductions, factory stories. Free and public, no account needed.","測試報告、產品介紹、工廠故事。免費公開，不需帳號。","テストレポート、製品紹介、工場ストーリー。無料公開でアカウント不要。","Testberichte, Produktvorstellungen, Werkstattgeschichten. Kostenlos, kein Konto erforderlich.") },
        { _key: "st2", title: ls("Apply","申請","申し込む","Bewerben"), body: lt("Membership is free. Our team at Point Asia reviews every application.","會員資格免費。Point Asia 團隊審核每份申請。","会員資格は無料。Point Asia チームが申請を個別に審査。","Mitgliedschaft kostenlos. Unser Team bei Point Asia prüft jeden Antrag.") },
        { _key: "st3", title: ls("Express interest","表達興趣","興味を表明","Interesse bekunden"), body: lt("Flag the products you'd like to carry.","標記你想引進的產品。","取り扱いたい製品をフラグ。","Markieren Sie die Produkte, die Sie führen möchten.") },
        { _key: "st4", title: ls("Group buy opens","團購開跑","グループバイ開始","Gruppenbestellung"), body: lt("When demand is confirmed, the order goes live on Patisco.","需求確認後，訂單在 Patisco 上線。","需要が確認されたら Patisco で注文が公開される。","Wenn die Nachfrage bestätigt ist, geht die Bestellung auf Patisco live.") },
        { _key: "st5", title: ls("Order & receive","下單收貨","注文・受け取り","Bestellen & empfangen"), body: lt("Order, pay locally, and receive your stock.","下單、當地付款、收到貨品。","注文、現地払い、商品受け取り。","Bestellen, lokal bezahlen und Ihre Ware empfangen.") },
      ]},
      { _key: "cta", _type: "ctaSection", heading: ls("Apply as a shop member","申請車店會員","ショップ会員として申し込む","Als Shop-Mitglied bewerben"), buttonLabel: ls("Start the application →","開始申請 →","申し込みを始める →","Bewerbung starten →"), finePrint: ls("Membership is free. Applications are reviewed by our team at Point Asia.","會員資格免費。申請由 Point Asia 團隊審核。","会員資格は無料。申請は Point Asia チームが審査します。","Mitgliedschaft kostenlos. Bewerbungen werden von unserem Team bei Point Asia geprüft."), href: "#" },
    ],
  },

  suppliers: {
    slug: "suppliers",
    heroStyle: "dark",
    heroEyebrow: ls("For suppliers","供應商專區","サプライヤー向け","Für Lieferanten"),
    heroHeadline: ls("Your components deserve a wider audience.","你的零件值得被更多人看見。","あなたのコンポーネントは、もっと広い舞台に出るべきだ。","Ihre Komponenten verdienen ein breiteres Publikum."),
    heroLead: lt("You've been making quality parts for decades. Some of the world's best-known bikes have your components inside them — they just don't say so.","你已經做了幾十年的好零件。世界上某些最知名的自行車裡，就裝著你的組件——只是沒有人說出來。","何十年もかけてクオリティの高い部品を作ってきた。ただ、そう言われていないだけだ。","Sie stellen seit Jahrzehnten qualitativ hochwertige Teile her. Sie sagen es nur nicht."),
    heroBody: lt("Independent shops worldwide would carry your products if they could find them, verify them, and order them in quantities that make sense.","全球的獨立車店願意引進你的產品，只要他們找得到、驗得了、訂得起合理的量。","世界中の独立系ショップは、見つけられ、確認でき、適切な数量で注文できるなら、あなたの製品を取り扱いたいと思っている。","Unabhängige Shops weltweit würden Ihre Produkte führen, wenn sie sie finden, prüfen und in sinnvollen Mengen bestellen könnten."),
    specItems: [
      { _key: "s1", label: ls("You set","你決定","あなたが決める","Sie bestimmen"), value: ls("Price · MOQ · Lead time","售價 · 最低起訂量 · 交期","価格・最低発注量・リードタイム","Preis · MOQ · Lieferzeit") },
      { _key: "s2", label: ls("We write in","我們用","執筆言語","Wir schreiben in"), value: ls("EN · 中 · 日 · DE","EN · 中 · 日 · DE","EN・中・日・DE","EN · 中 · 日 · DE") },
      { _key: "s3", label: ls("Buyers","買家","バイヤー","Käufer"), value: ls("Verified trade only","僅限通過認證的業者","認証済み業者のみ","Nur verifizierter Handel") },
      { _key: "s4", label: ls("Orders","訂單","注文","Bestellungen"), value: ls("Aggregated","聚合式團購","グループバイ方式","Aggregiert") },
    ],
    sections: [
      { _key: "prose", _type: "proseSection", heading: ls("The gap we close","我們填補的缺口","私たちが埋めるギャップ","Die Lücke, die wir schließen"), paragraphs: [
        { _key: "p1", text: lt("Reaching overseas independent shops is expensive and complicated. Minimum order quantities, language barriers, and distribution layers eat into margin before the first unit ships.","觸達海外獨立車店既昂貴又複雜。最低起訂量、語言障礙和層層代理，在第一個貨出去之前就已經侵蝕掉利潤。","海外の独立系ショップへのリーチはコストも手間もかかる。","Unabhängige Shops im Ausland zu erreichen ist teuer und kompliziert.") },
        { _key: "p2", text: lt("Pedaling Forward introduces your components to an audience of verified shop owners, buyers, and distributors who are actively looking for better sourcing options. When interest is high enough, Patisco aggregates the orders — so you hit your MOQ without negotiating with dozens of shops one at a time.","Pedaling Forward 把你的零件介紹給一群正在積極尋找更好採購來源的認證車店主、買家和通路商。當興趣夠大，Patisco 就會聚合訂單——讓你達到最低起訂量，不必一家一家去談。","Pedaling Forward は認証済みのショップオーナー、バイヤー、ディストリビューターにあなたのコンポーネントを紹介する。","Pedaling Forward stellt Ihre Komponenten einem Publikum aus verifizierten Shop-Inhabern vor.") },
      ]},
      { _key: "benefits", _type: "benefitsSection", heading: ls("What you get","你能得到什麼","得られるもの","Was Sie bekommen"), items: [
        { _key: "b1", title: ls("Editorial exposure in four languages","四語言編輯曝光","4言語での編集露出","Redaktionelle Sichtbarkeit in vier Sprachen"), body: lt("We write about your products in English, Chinese, Japanese, and German — test reports, spec breakdowns, and factory context that helps buyers understand what they're looking at.","我們用英文、中文、日文、德文撰寫你的產品——測試報告、規格解析、工廠背景，幫助買家真正看懂你的東西。","英語・中国語・日本語・ドイツ語であなたの製品を紹介する。","Wir schreiben über Ihre Produkte auf Englisch, Chinesisch, Japanisch und Deutsch.") },
        { _key: "b2", title: ls("Demand aggregation","需求聚合","需要の集約","Nachfragebündelung"), body: lt("Orders come in as a group buy, not one small purchase at a time. You set the price, MOQ, and lead time. We handle the buyer side.","訂單以團購形式進來，不是一次一點。你決定售價、最低起訂量和交期，我們負責買家端。","注文はグループバイとしてまとまって入ってくる。","Bestellungen kommen als Gruppenbestellung.") },
        { _key: "b3", title: ls("Qualified buyers only","只有通過認證的買家","認証済みバイヤーのみ","Nur qualifizierte Käufer"), body: lt("Every member is verified by our team at Point Asia. You're talking to trade professionals — shop owners, buyers, distributors.","每位會員都由 Point Asia 團隊審核。你面對的是專業業者——車店主、買家、通路商。","すべての会員は Point Asia チームによって審査されている。","Jedes Mitglied wird von unserem Team bei Point Asia verifiziert.") },
        { _key: "b4", title: ls("You stay in control","你主導一切","主導権はあなたに","Sie behalten die Kontrolle"), body: lt("You set the terms. We facilitate the connection and handle order logistics through Patisco.","你定條件。我們透過 Patisco 促成連結、處理訂單物流。","条件はあなたが決める。","Sie legen die Bedingungen fest.") },
      ]},
      { _key: "cta", _type: "ctaSection", heading: ls("List your products","刊登你的產品","製品を掲載する","Ihre Produkte listen"), buttonLabel: ls("Talk to us →","與我們洽談 →","お問い合わせ →","Mit uns sprechen →"), finePrint: ls("We're selective about what we feature. If your products are worth knowing, we'd like to hear from you.","我們對刊登內容有所選擇。如果你的產品值得被認識，歡迎與我們聯絡。","掲載内容には選択基準があります。","Wir sind selektiv."), href: "#" },
    ],
  },

  distributors: {
    slug: "distributors",
    heroStyle: "dark",
    heroEyebrow: ls("For distributors","通路商專區","ディストリビューター向け","Für Händler"),
    heroHeadline: ls("Better products. Better margin. Less guesswork.","更好的產品。更好的利潤。更少的猜測。","より良い製品。より良い利益。より少ない不確実性。","Bessere Produkte. Bessere Marge. Weniger Rätselraten."),
    heroLead: lt("You know what your retailers want. They're asking for more variety, better quality, and margins that make sense.","你知道你的零售商要什麼。他們要更多選擇、更好的品質，還有合理的利潤空間。","小売店が何を求めているかはわかっている。","Sie wissen, was Ihre Händler wollen."),
    heroBody: lt("The answer is usually somewhere in Taiwan — the question is how to get there without adding another layer in the middle.","答案通常就在台灣——問題是如何在不增加中間層的情況下取得。","答えはたいてい台湾にある。","Die Antwort liegt meistens irgendwo in Taiwan."),
    sections: [
      { _key: "prose", _type: "proseSection", heading: ls("What changes","改變了什麼","何が変わるか","Was sich ändert"), paragraphs: [
        { _key: "p1", text: lt("Pedaling Forward connects you directly to verified Taiwan suppliers. Group buys on Patisco let you consolidate orders from your retailers into a single purchase — hitting the minimum quantity without carrying the inventory risk alone.","Pedaling Forward 直接把你與通過認證的台灣供應商連結起來。Patisco 上的團購讓你把零售商的需求整合成一筆採購。","Pedaling Forward があなたを認証済みの台湾サプライヤーと直接つなぐ。","Pedaling Forward verbindet Sie direkt mit verifizierten Taiwan-Lieferanten.") },
        { _key: "p2", text: lt("Payment is local. Delivery is door-to-door. No freight forwarding, no customs brokerage on your end.","當地幣別付款。直送到府。不需要自行安排貨運或辦理通關。","支払いは現地通貨。配送はドアツードア。","Zahlung in lokaler Währung. Haustürlieferung.") },
      ]},
      { _key: "benefits", _type: "benefitsSection", heading: ls("What you get","你能得到什麼","得られるもの","Was Sie bekommen"), items: [
        { _key: "b1", title: ls("Direct Taiwan supplier access","直接接觸台灣供應商","台湾サプライヤーへの直接アクセス","Direkter Zugang zu Taiwan-Lieferanten"), body: lt("Relationships built over 40 years of component trade — vetted, reliable, and ready to work with overseas distributors.","Point Asia 40 年零件貿易累積的合作關係——可靠、經過驗證，且準備好與海外通路商合作。","40年のコンポーネント取引で築いた関係。","Beziehungen aus über 40 Jahren Komponentenhandel.") },
        { _key: "b2", title: ls("Consolidated ordering","整合訂購","注文の一本化","Konsolidierte Bestellung"), body: lt("Aggregate your retailers' demand into one group buy. One shipment, one payment, one contact.","把零售商的需求聚合成一次團購。一批貨、一筆付款、一個聯絡窗口。","小売店の需要を1回のグループバイにまとめる。","Bündeln Sie die Nachfrage Ihrer Händler in einer Gruppenbestellung.") },
        { _key: "b3", title: ls("Better margin","更好的利潤","より良い利益","Bessere Marge"), body: lt("Fewer hands between the factory and your warehouse. The math works differently when you buy closer to the source.","工廠到你倉庫之間的中間層更少。買得越接近源頭，帳就算得越漂亮。","工場からあなたの倉庫までの中間業者が減る。","Weniger Hände zwischen Fabrik und Ihrem Lager.") },
        { _key: "b4", title: ls("Pay locally, receive door-to-door","當地幣別付款，直送到府","現地払い・ドアツードア配送","Lokal zahlen, Haustürlieferung"), body: lt("Patisco handles the transaction in your local currency. Your stock ships direct from Taiwan to your door.","Patisco 以你的當地幣別處理付款。貨品從台灣直送到你的門口。","Patisco が現地通貨で取引を処理する。","Patisco wickelt die Transaktion in Ihrer Landeswährung ab.") },
      ]},
      { _key: "cta", _type: "ctaSection", heading: ls("Apply as a distributor","申請成為通路商","ディストリビューターとして申し込む","Als Händler bewerben"), buttonLabel: ls("Start the application →","開始申請 →","申し込みを始める →","Bewerbung starten →"), finePrint: ls("Applications are reviewed by our team at Point Asia.","申請由 Point Asia 團隊審核。","申請は Point Asia チームが審査します。","Bewerbungen werden von unserem Team bei Point Asia geprüft."), href: "#" },
    ],
  },

  "how-it-works": {
    slug: "how-it-works",
    heroStyle: "red",
    heroEyebrow: ls("How it works","如何運作","仕組み","So funktioniert's"),
    heroHeadline: ls("From Taiwan factory to your shop floor.","從台灣工廠到你的店面。","台湾の工場から、あなたのショップへ。","Von der taiwanesischen Fabrik auf Ihren Ladenboden."),
    sections: [
      { _key: "steps", _type: "stepsSection", heading: ls("","","",""), items: [
        { _key: "st1", title: ls("Read","閱讀","読む","Lesen"), body: lt("Pedaling Forward publishes test reports, product introductions, factory visits, and market notes. All content is free and public — no account required.","Pedaling Forward 發布測試報告、產品介紹、工廠參訪記錄與市場觀察。所有內容免費公開，不需帳號。","Pedaling Forward はテストレポート、製品紹介、工場訪問、マーケットノートを発行している。すべてのコンテンツは無料公開でアカウント不要。","Pedaling Forward veröffentlicht Testberichte, Produktvorstellungen, Fabrikbesuche und Marktnotizen. Alle Inhalte sind kostenlos und öffentlich.") },
        { _key: "st2", title: ls("Join","加入","参加する","Beitreten"), body: lt("Apply for a free membership. Our team at Point Asia Co., Ltd. reviews every application personally. We're looking for shop owners, buyers, mechanics, and distributors who work professionally with bicycle components.","申請免費會員資格。律寶實業的團隊會親自審核每一份申請。我們尋找的是以自行車零件為業的車店主、採購人員、技師和通路商。","無料の会員資格に申し込む。Point Asia Co., Ltd. のチームが申請を個別に審査する。","Bewerben Sie sich für eine kostenlose Mitgliedschaft. Unser Team bei Point Asia Co., Ltd. prüft jeden Antrag persönlich.") },
        { _key: "st3", title: ls("Express interest","表達興趣","興味を表明する","Interesse bekunden"), body: lt("See a product worth carrying? Hit \"Express Interest.\" When enough members flag the same product, we know there's real demand — and we go to work on the supplier side.","看到值得引進的產品？按下「表達興趣」。當足夠多的會員標記同一件產品，我們就知道有真實需求——然後去供應商那邊談。","取り扱いたい製品を見つけたら「興味を表明」を押す。","Sehen Sie ein Produkt, das sich lohnt? Klicken Sie auf \"Interesse bekunden\".") },
        { _key: "st4", title: ls("Group buy opens","團購開跑","グループバイが始まる","Gruppenbestellung startet"), body: lt("When demand is confirmed, a group buy opens on Patisco. You'll see the price, the minimum quantity, and the lead time. No obligation — you decide if it works for your business.","需求確認後，Patisco 上的團購正式開放。你會看到售價、最低起訂量和交期。沒有任何義務——由你決定是否適合你的生意。","需要が確認されると、Patisco でグループバイが公開される。","Wenn die Nachfrage bestätigt ist, öffnet eine Gruppenbestellung auf Patisco.") },
        { _key: "st5", title: ls("Order and receive","下單收貨","注文して受け取る","Bestellen und empfangen"), body: lt("Place your order on Patisco. Pay in your local currency. Your stock ships door-to-door from Taiwan.","在 Patisco 下單。以當地幣別付款。貨品從台灣直送到你的門口。","Patisco で注文する。現地通貨で支払う。台湾からドアツードアで配送される。","Geben Sie Ihre Bestellung auf Patisco auf. Zahlen Sie in Ihrer Landeswährung.") },
      ]},
      { _key: "note", _type: "noteSection", text: lt("Articles are free and public. Group buy participation requires a free membership. All applications are reviewed by our team.","文章免費公開。參與團購需要免費會員資格。所有申請均由我們的團隊審核。","記事は無料公開。グループバイへの参加には無料会員資格が必要。","Artikel sind kostenlos und öffentlich. Die Teilnahme an Gruppenbestellungen erfordert eine kostenlose Mitgliedschaft.") },
    ],
  },

  about: {
    slug: "about",
    heroStyle: "dark",
    heroEyebrow: ls("About","關於我們","私たちについて","Über uns"),
    heroHeadline: ls("Forty years in the component trade. Now with a website.","四十年零件貿易，現在有了一個網站。","コンポーネント取引40年。ついにウェブサイトを開設。","Vierzig Jahre im Komponentenhandel. Jetzt mit einer Website."),
    heroLead: lt("Point Asia Co., Ltd. (律寶實業) has been bridging Taiwanese component manufacturers and the global bicycle market since 1983.","律寶實業（Point Asia Co., Ltd.）自 1983 年起，持續連結台灣零件製造商與全球自行車市場。","Point Asia Co., Ltd.（律寶實業）は1983年から、台湾のコンポーネントメーカーと世界の自転車市場をつなぎ続けてきた。","Point Asia Co., Ltd. (律寶實業) verbindet seit 1983 taiwanesische Komponentenhersteller mit dem globalen Fahrradmarkt."),
    heroBody: lt("We speak the factories' language — literally and figuratively — and we've spent four decades learning which ones are worth knowing. Pedaling Forward is where we put that knowledge to work.","我們說得懂工廠的語言——字面上和實質上都是。四十年來，我們一直在學習哪些廠商值得認識。Pedaling Forward 是我們把這些知識付諸行動的地方。","私たちは工場の言葉を、文字通りにも実質的にも話せる。Pedaling Forward はその知識を活かす場だ。","Wir sprechen die Sprache der Fabriken. Pedaling Forward ist der Ort, an dem wir dieses Wissen einsetzen."),
    sections: [
      { _key: "benefits", _type: "benefitsSection", heading: ls("","","",""), items: [
        { _key: "b1", title: ls("What this site is","這個網站是什麼","このサイトとは","Was diese Website ist"), body: lt("This is our editorial side. Before anyone places an order, they need to know what they're looking at. Pedaling Forward publishes test reports, factory visits, product introductions, and market notes — in English, Chinese, Japanese, and German. All content is free and public. Membership is what gets you into the group buys.","這是我們的編輯端。在任何人下訂單之前，他們需要先了解自己在看什麼。Pedaling Forward 以英文、中文、日文、德文發布測試報告、工廠參訪、產品介紹和市場觀察。所有內容免費公開。會員資格才能參與團購。","これは私たちの編集部門だ。Pedaling Forward は英語・中国語・日本語・ドイツ語でテストレポート、工場訪問、製品紹介、マーケットノートを発行している。","Dies ist unsere redaktionelle Seite. Pedaling Forward veröffentlicht Testberichte, Fabrikbesuche, Produktvorstellungen und Marktnotizen auf Englisch, Chinesisch, Japanisch und Deutsch.") },
        { _key: "b2", title: ls("What Patisco is","Patisco 是什麼","Patisco とは","Was Patisco ist"), body: lt("Patisco is our commerce platform. When enough buyers express interest in a product, we open a group buy. Members place their orders through Patisco, pay in their local currency, and receive their stock shipped door-to-door from Taiwan. Patisco handles the purchasing. Pedaling Forward handles the intelligence.","Patisco 是我們的商務平台。當有足夠多的買家對某項產品表達興趣，我們就開放團購。會員透過 Patisco 下單，以當地幣別付款，貨品從台灣直送到府。Patisco 負責採購，Pedaling Forward 負責情報。","Patisco は私たちのコマースプラットフォームだ。Patisco が購買を担い、Pedaling Forward がインテリジェンスを担う。","Patisco ist unsere Handelsplattform. Patisco übernimmt den Kauf. Pedaling Forward übernimmt die Informationsarbeit.") },
        { _key: "b3", title: ls("Who we are","我們是誰","私たちとは","Wer wir sind"), body: lt("Point Asia Co., Ltd. was founded in 1983 in Taiwan. We work directly with component manufacturers across the island — brakes, drivetrains, wheels, accessories — and have been connecting them with shops and distributors worldwide for over forty years. Our team reads, writes, and does business in English, Traditional Chinese, Japanese, and German.","律寶實業於 1983 年在台灣創立。我們直接與全島的零件製造商合作——煞車、傳動、輪組、配件——四十多年來持續將他們與全球的車店及通路商連結起來。我們的團隊以英文、繁體中文、日文和德文閱讀、撰寫、做生意。","Point Asia Co., Ltd. は1983年に台湾で設立された。40年以上にわたって世界のショップやディストリビューターとつなぎ続けてきた。","Point Asia Co., Ltd. wurde 1983 in Taiwan gegründet. Wir verbinden sie seit über vierzig Jahren mit Shops und Distributoren weltweit.") },
        { _key: "b4", title: ls("How to reach us","如何聯絡我們","お問い合わせ","Kontakt"), body: lt("Point Asia Co., Ltd. (律寶實業), Taiwan.","律寶實業（Point Asia Co., Ltd.），台灣。","Point Asia Co., Ltd.（律寶實業）、台湾。","Point Asia Co., Ltd. (律寶實業), Taiwan.") },
      ]},
    ],
  },
};
