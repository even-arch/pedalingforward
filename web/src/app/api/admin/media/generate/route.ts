import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth, getAnthropicKey, getAiWritingRules } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const LOCALES = ["en", "zh", "ja", "de"] as const;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { itemIds, editorialNote } = body as { itemIds?: string[]; editorialNote?: string };

  if (!itemIds?.length) {
    return Response.json({ error: "itemIds required" }, { status: 400 });
  }

  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    return Response.json({ error: "No Anthropic API key configured. Add it in Settings." }, { status: 500 });
  }

  const items = await writeClient.fetch<
    { _id: string; title: string; description?: string; url: string; sourceName?: string }[]
  >(
    `*[_type == "mediaItem" && _id in $ids]{_id, title, description, url, sourceName}`,
    { ids: itemIds },
    { cache: "no-store" }
  );

  const writingRules = await getAiWritingRules();

  const sourceText = items
    .map((it, i) => `SOURCE ${i + 1}: ${it.sourceName ?? "Unknown"}\nTitle: ${it.title}\nURL: ${it.url}\nSummary: ${it.description ?? "(none)"}`)
    .join("\n\n---\n\n");

  const noteSection = editorialNote ? `\nEDITORIAL NOTE: ${editorialNote}\n` : "";

  const prompt = `You are writing for Pedaling Forward, a trade publication for the global bicycle industry.

WRITING RULES:
${writingRules}
${noteSection}
SOURCE ARTICLES:
${sourceText}

Write a comprehensive trade news article synthesizing the above sources. Then translate it into Traditional Chinese (繁體中文), Japanese, and German.

Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "en": {
    "title": "Article title in English",
    "excerpt": "One-sentence summary (max 200 chars)",
    "body": "Full article body in markdown. Use ## for section headings, ### for sub-headings. Paragraphs separated by blank lines. 400-700 words."
  },
  "zh": {
    "title": "繁體中文標題",
    "excerpt": "一句話摘要（最多200字）",
    "body": "繁體中文正文，使用 ## 和 ### 作為標題。段落用空行分隔。"
  },
  "ja": {
    "title": "日本語タイトル",
    "excerpt": "一文の要約（200字以内）",
    "body": "日本語本文。## と ### を見出しに使用。段落は空行で区切る。"
  },
  "de": {
    "title": "Deutscher Titel",
    "excerpt": "Einzeiliger Überblick (max. 200 Zeichen)",
    "body": "Deutschsprachiger Artikeltext. ## für Abschnitte, ### für Unterabschnitte. Absätze mit Leerzeile trennen."
  }
}`;

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON — handle potential markdown code fences
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({ error: "AI did not return valid JSON", raw: text.slice(0, 500) }, { status: 500 });
  }

  let parsed: Record<string, { title: string; excerpt: string; body: string }>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ error: "Failed to parse AI response", raw: text.slice(0, 500) }, { status: 500 });
  }

  // Validate required locales
  for (const locale of LOCALES) {
    if (!parsed[locale]?.title) {
      return Response.json({ error: `Missing locale: ${locale}` }, { status: 500 });
    }
  }

  return Response.json({ ok: true, article: parsed, sourceItemIds: itemIds });
}
