import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth, getAnthropicKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const SEED_CONTENT = {
  heroEyebrow: "Est. 1983 · Point Asia Co., Ltd. · 律寶實業",
  heroHeadline: { en: "Taiwan's components, finally with a voice.", zh: "台灣零件，終於有了自己的聲音。", ja: "台湾パーツが、ついに語り始めた。", de: "Taiwanesische Komponenten. Endlich mit einer Stimme." },
  heroSubtext:  { en: "Test reports, product introductions, and shop-floor stories from the Taiwanese factories and workshops that keep the world's bikes rolling.", zh: "來自台灣工廠與工坊的測試報告、產品介紹與現場故事，讓全球的自行車持續運轉。", ja: "世界中の自転車を支える台湾の工場・工房から届くテストレポート、製品紹介、現場ストーリー。", de: "Testberichte, Produktvorstellungen und Werkstattgeschichten aus den taiwanesischen Fabriken und Werkstätten, die die Fahrräder der Welt am Rollen halten." },
  stats: [
    { _key: "stat-shops",     value: "200+",              label: { en: "Bike shops served worldwide",      zh: "全球合作車店",       ja: "世界中の提携店",       de: "Fahrradläden weltweit" } },
    { _key: "stat-years",     value: "40 YR",             label: { en: "Taiwan component trade expertise", zh: "台灣零件貿易經驗",   ja: "台湾部品取引の経験",   de: "Erfahrung im Komponentenhandel" } },
    { _key: "stat-languages", value: "EN · 中 · 日 · DE", label: { en: "Four languages, one source",      zh: "四種語言，一個來源", ja: "4言語、1つの情報源",   de: "Vier Sprachen, eine Quelle" } },
  ],
  joinHeadline: { en: "Stay ahead of Taiwan's component market", zh: "掌握台灣零件市場的最新動態", ja: "台湾部品市場の最前線を把握する", de: "Behalten Sie Taiwans Komponentenmarkt im Blick" },
  joinSubtext:  { en: "Trade intelligence, product launches, and sourcing opportunities — delivered to bike shops and distributors worldwide.", zh: "貿易情報、新品發布與採購機會，直送全球車店與通路商。", ja: "貿易情報・新製品・調達機会を、世界中の自転車店と販売店にお届けします。", de: "Handelsinformationen, Produkteinführungen und Beschaffungsmöglichkeiten — für Fahrradläden und Händler weltweit." },
};

const SETTINGS_ID = "siteSettings";

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };

async function translateAll(en: string, context: string): Promise<{ zh: string; ja: string; de: string }> {
  const key = await getAnthropicKey();
  if (!key) throw new Error("No Anthropic API key configured");

  const client = new Anthropic({ apiKey: key });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a professional translator for a Taiwanese bicycle industry media site.
Translate the following text (${context}) into three languages.
Respond ONLY with a JSON object — no explanation, no markdown.

Source (English): ${en}

Output format:
{
  "zh": "<Traditional Chinese translation, natural for Taiwan>",
  "ja": "<Japanese translation>",
  "de": "<German translation>"
}`,
      },
    ],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const json = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(json);
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch current English values
  const settings = await writeClient.fetch<{
    heroHeadline?: LocalizedStr;
    heroSubtext?: LocalizedStr;
    stats?: { value?: string; label?: LocalizedStr; _key?: string }[];
    joinHeadline?: LocalizedStr;
    joinSubtext?: LocalizedStr;
  }>(
    `*[_type == "siteSettings" && _id == $id][0]{
      heroHeadline, heroSubtext,
      "stats": stats[]{ _key, value, label },
      joinHeadline, joinSubtext
    }`,
    { id: SETTINGS_ID },
    { cache: "no-store" }
  );

  if (!settings) {
    // Document doesn't exist yet — seed it with pre-translated content and return
    await writeClient
      .transaction()
      .createIfNotExists({ _id: SETTINGS_ID, _type: "siteSettings" })
      .patch(SETTINGS_ID, (p) => p.set(SEED_CONTENT))
      .commit();
    return Response.json({ ok: true, seeded: true });
  }

  const translated: Record<string, unknown> = {};

  // heroHeadline
  if (settings.heroHeadline?.en) {
    const t = await translateAll(settings.heroHeadline.en, "website hero headline");
    translated.heroHeadline = { ...settings.heroHeadline, ...t };
  }

  // heroSubtext
  if (settings.heroSubtext?.en) {
    const t = await translateAll(settings.heroSubtext.en, "website hero subtext paragraph");
    translated.heroSubtext = { ...settings.heroSubtext, ...t };
  }

  // joinHeadline
  if (settings.joinHeadline?.en) {
    const t = await translateAll(settings.joinHeadline.en, "email subscription section headline");
    translated.joinHeadline = { ...settings.joinHeadline, ...t };
  }

  // joinSubtext
  if (settings.joinSubtext?.en) {
    const t = await translateAll(settings.joinSubtext.en, "email subscription section subtext");
    translated.joinSubtext = { ...settings.joinSubtext, ...t };
  }

  // stats labels
  if (settings.stats?.length) {
    const translatedStats = await Promise.all(
      settings.stats.map(async (stat) => {
        if (!stat.label?.en) return stat;
        const t = await translateAll(stat.label.en, "short homepage stat label (3-6 words max)");
        return { ...stat, label: { ...stat.label, ...t } };
      })
    );
    translated.stats = translatedStats;
  }

  if (!Object.keys(translated).length) {
    return Response.json({ error: "No English content found to translate in siteSettings" }, { status: 400 });
  }

  await writeClient.patch(SETTINGS_ID).set(translated).commit();

  return Response.json({ ok: true, translated });
}
