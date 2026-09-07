import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth, getAnthropicKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

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
    return Response.json({ error: "siteSettings not found in Sanity" }, { status: 404 });
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
