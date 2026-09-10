import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey, getAiWritingRules } from "./admin";
import { writeClient } from "@/sanity/lib/write-client";
import { db } from "./db";

const LOCALES = ["en", "zh", "ja", "de"] as const;

// Keep summaries short to avoid hitting max_tokens mid-JSON (4 locales × title+summary+3 points ≈ 1200-1800 tokens)
const GENERATE_PROMPT = (writingRules: string, noteSection: string, sourceText: string) =>
  `You are an editor for Pedaling Forward, a trade publication for the global bicycle industry.

WRITING RULES:
${writingRules}
${noteSection}
SOURCE ARTICLES:
${sourceText}

Write a SUMMARY and 3 KEY POINTS synthesizing the above source(s). Do NOT rewrite or translate the source articles — write original editorial analysis with a Taiwan supply-chain perspective.

Then translate your summary and key points into Traditional Chinese (繁體中文), Japanese, and German.

Keep each summary to 2-3 sentences max. Keep each key point under 15 words.

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "en": {
    "title": "Short headline (max 10 words)",
    "summary": "2-3 sentences. Our editorial take, not a rewrite of the source.",
    "keyPoints": [
      "Key point 1 — trade significance",
      "Key point 2",
      "Key point 3"
    ]
  },
  "zh": {
    "title": "繁體中文標題（10字內）",
    "summary": "繁體中文摘要（2-3句）",
    "keyPoints": ["重點1", "重點2", "重點3"]
  },
  "ja": {
    "title": "日本語タイトル（10語以内）",
    "summary": "日本語要約（2-3文）",
    "keyPoints": ["ポイント1", "ポイント2", "ポイント3"]
  },
  "de": {
    "title": "Deutscher Titel (max 10 Wörter)",
    "summary": "Deutsche Zusammenfassung (2-3 Sätze)",
    "keyPoints": ["Punkt 1", "Punkt 2", "Punkt 3"]
  }
}`;

export async function processGenerationJob(jobId: string): Promise<void> {
  await db.mediaGenerationJob.update({ where: { id: jobId }, data: { status: "running" } });

  try {
    const job = await db.mediaGenerationJob.findUniqueOrThrow({ where: { id: jobId } });

    const apiKey = await getAnthropicKey();
    if (!apiKey) throw new Error("No Anthropic API key configured. Add it in Admin → 系統設定.");

    const items = await writeClient.fetch<{
      _id: string; title: string; description?: string; summary?: string;
      keyPoints?: string[]; url: string; sourceName?: string; sourceLanguage?: string;
    }[]>(
      `*[_type == "mediaItem" && _id in $ids]{_id, title, description, summary, keyPoints, url, sourceName, sourceLanguage}`,
      { ids: job.itemIds },
      { cache: "no-store" }
    );

    if (!items.length) throw new Error("找不到指定的文章（可能已從 Sanity 刪除）");

    const primaryUrl = items[0]?.url;
    const primarySource = items[0]?.sourceName;

    const writingRules = await getAiWritingRules();
    const noteSection = job.editorialNote ? `\nEDITORIAL NOTE FROM EDITOR: ${job.editorialNote}\n` : "";

    const sourceText = items
      .map((it, i) => {
        const content = it.summary || it.description || "(no summary)";
        const points = it.keyPoints?.length
          ? "\nKey points:\n" + it.keyPoints.map((p) => `- ${p}`).join("\n")
          : "";
        return `SOURCE ${i + 1} [${it.sourceLanguage ?? "en"}]: ${it.sourceName ?? "Unknown"}\nTitle: ${it.title}\nURL: ${it.url}\nContent: ${content}${points}`;
      })
      .join("\n\n---\n\n");

    const anthropic = new Anthropic({ apiKey });

    const LOCALE_SCHEMA = {
      type: "object" as const,
      required: ["title", "summary", "keyPoints"],
      properties: {
        title:     { type: "string" as const },
        summary:   { type: "string" as const },
        keyPoints: { type: "array" as const, items: { type: "string" as const }, minItems: 1, maxItems: 3 },
      },
    };
    const OUTPUT_SCHEMA = {
      type: "object" as const,
      required: ["en", "zh", "ja", "de"],
      properties: { en: LOCALE_SCHEMA, zh: LOCALE_SCHEMA, ja: LOCALE_SCHEMA, de: LOCALE_SCHEMA },
    };

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      tools: [{ name: "output_article", description: "Output the multilingual article content", input_schema: OUTPUT_SCHEMA }],
      tool_choice: { type: "tool", name: "output_article" },
      messages: [{ role: "user", content: GENERATE_PROMPT(writingRules, noteSection, sourceText) }],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: Record<string, { title: string; summary: string; keyPoints: string[] }> } | undefined;
    if (!toolBlock) throw new Error("AI 沒有回傳有效的 JSON");

    const parsed = toolBlock.input;
    for (const locale of LOCALES) {
      if (!parsed[locale]?.title) throw new Error(`AI 回傳資料缺少語言：${locale}`);
    }

    await db.mediaGenerationJob.update({
      where: { id: jobId },
      data: { status: "done", result: parsed, primaryUrl, primarySource, doneAt: new Date() },
    });
  } catch (err) {
    await db.mediaGenerationJob
      .update({
        where: { id: jobId },
        data: { status: "error", error: String(err), doneAt: new Date() },
      })
      .catch(() => {});
  }
}
