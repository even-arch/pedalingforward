import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const SETTINGS_ID = "siteSettings";

const CONTENT = {
  heroEyebrow: "Est. 1983 · Point Asia Co., Ltd. · 律寶實業",

  heroHeadline: {
    en: "Taiwan's components, finally with a voice.",
    zh: "台灣零件，終於有了自己的聲音。",
    ja: "台湾パーツが、ついに語り始めた。",
    de: "Taiwanesische Komponenten. Endlich mit einer Stimme.",
  },

  heroSubtext: {
    en: "Test reports, product introductions, and shop-floor stories from the Taiwanese factories and workshops that keep the world's bikes rolling.",
    zh: "來自台灣工廠與工坊的測試報告、產品介紹與現場故事，讓全球的自行車持續運轉。",
    ja: "世界中の自転車を支える台湾の工場・工房から届くテストレポート、製品紹介、現場ストーリー。",
    de: "Testberichte, Produktvorstellungen und Werkstattgeschichten aus den taiwanesischen Fabriken und Werkstätten, die die Fahrräder der Welt am Rollen halten.",
  },

  stats: [
    {
      _key: "stat-shops",
      value: "200+",
      label: {
        en: "Bike shops served worldwide",
        zh: "全球合作車店",
        ja: "世界中の提携店",
        de: "Fahrradläden weltweit",
      },
    },
    {
      _key: "stat-years",
      value: "40 YR",
      label: {
        en: "Taiwan component trade expertise",
        zh: "台灣零件貿易經驗",
        ja: "台湾部品取引の経験",
        de: "Erfahrung im Komponentenhandel",
      },
    },
    {
      _key: "stat-languages",
      value: "EN · 中 · 日 · DE",
      label: {
        en: "Four languages, one source",
        zh: "四種語言，一個來源",
        ja: "4言語、1つの情報源",
        de: "Vier Sprachen, eine Quelle",
      },
    },
  ],

  joinHeadline: {
    en: "Stay ahead of Taiwan's component market",
    zh: "掌握台灣零件市場的最新動態",
    ja: "台湾部品市場の最前線を把握する",
    de: "Behalten Sie Taiwans Komponentenmarkt im Blick",
  },

  joinSubtext: {
    en: "Trade intelligence, product launches, and sourcing opportunities — delivered to bike shops and distributors worldwide.",
    zh: "貿易情報、新品發布與採購機會，直送全球車店與通路商。",
    ja: "貿易情報・新製品・調達機会を、世界中の自転車店と販売店にお届けします。",
    de: "Handelsinformationen, Produkteinführungen und Beschaffungsmöglichkeiten — für Fahrradläden und Händler weltweit.",
  },
};

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await writeClient.fetch<{ _id?: string }>(
    `*[_type == "siteSettings" && _id == $id][0]{ _id }`,
    { id: SETTINGS_ID },
    { cache: "no-store" }
  );

  if (!existing) {
    await writeClient.createOrReplace({
      _id: SETTINGS_ID,
      _type: "siteSettings",
      ...CONTENT,
    });
  } else {
    await writeClient.patch(SETTINGS_ID).set(CONTENT).commit();
  }

  return Response.json({ ok: true });
}
