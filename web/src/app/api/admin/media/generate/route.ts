import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth, getAnthropicKey, getAiWritingRules } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const LOCALES = ["en", "zh", "ja", "de"] as const;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { itemIds, editorialNote, audience } = body as {
    itemIds?: string[];
    editorialNote?: string;
    audience?: string;
  };

  if (!itemIds?.length) {
    return Response.json({ error: "itemIds required" }, { status: 400 });
  }

  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    return Response.json({ error: "No Anthropic API key configured. Add it in Settings." }, { status: 500 });
  }

  const items = await writeClient.fetch<{
    _id: string; title: string; description?: string; summary?: string;
    keyPoints?: string[]; url: string; sourceName?: string; sourceLanguage?: string;
  }[]>(
    `*[_type == "mediaItem" && _id in $ids]{_id, title, description, summary, keyPoints, url, sourceName, sourceLanguage}`,
    { ids: itemIds },
    { cache: "no-store" }
  );

  const writingRules = await getAiWritingRules();
  const noteSection = editorialNote ? `\nEDITORIAL NOTE FROM EDITOR: ${editorialNote}\n` : "";

  // Use enriched summary if available, else fall back to RSS snippet
  const sourceText = items
    .map((it, i) => {
      const content = it.summary || it.description || "(no summary)";
      const points = it.keyPoints?.length ? "\nKey points:\n" + it.keyPoints.map((p) => `- ${p}`).join("\n") : "";
      return `SOURCE ${i + 1} [${it.sourceLanguage ?? "en"}]: ${it.sourceName ?? "Unknown"}\nTitle: ${it.title}\nURL: ${it.url}\nContent: ${content}${points}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are an editor for Pedaling Forward, a trade publication for the global bicycle industry.

WRITING RULES:
${writingRules}
${noteSection}
SOURCE ARTICLES:
${sourceText}

Write a SUMMARY and 3 KEY POINTS synthesizing the above source(s). Do NOT rewrite or translate the source articles — write original editorial analysis with a Taiwan supply-chain perspective.

Then translate your summary and key points into Traditional Chinese (繁體中文), Japanese, and German.

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "en": {
    "title": "Short headline (max 10 words)",
    "summary": "One paragraph (2-4 sentences). Our editorial take, not a rewrite of the source.",
    "keyPoints": [
      "Key point 1 — trade significance, e.g. what this means for Taiwan OEMs",
      "Key point 2",
      "Key point 3"
    ]
  },
  "zh": {
    "title": "繁體中文標題",
    "summary": "繁體中文摘要（2-4句）",
    "keyPoints": ["重點1", "重點2", "重點3"]
  },
  "ja": {
    "title": "日本語タイトル",
    "summary": "日本語要約（2-4文）",
    "keyPoints": ["ポイント1", "ポイント2", "ポイント3"]
  },
  "de": {
    "title": "Deutscher Titel",
    "summary": "Deutsche Zusammenfassung (2-4 Sätze)",
    "keyPoints": ["Punkt 1", "Punkt 2", "Punkt 3"]
  }
}`;

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json({ error: "AI did not return valid JSON", raw: text.slice(0, 500) }, { status: 500 });
  }

  let parsed: Record<string, { title: string; summary: string; keyPoints: string[] }>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ error: "Failed to parse AI response", raw: text.slice(0, 500) }, { status: 500 });
  }

  for (const locale of LOCALES) {
    if (!parsed[locale]?.title) {
      return Response.json({ error: `Missing locale: ${locale}` }, { status: 500 });
    }
  }

  return Response.json({
    ok: true,
    article: parsed,
    sourceItemIds: itemIds,
    primaryUrl: items[0]?.url,
    audience: audience ?? "both",
  });
}
