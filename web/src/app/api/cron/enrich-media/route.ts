import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { writeClient } from "@/sanity/lib/write-client";
import { getAnthropicKey, checkAdminAuth } from "@/lib/admin";
import { scrapeUrl } from "@/lib/firecrawl";
import { sendTelegram } from "@/lib/telegram";

async function verifyCron(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return checkAdminAuth(req as unknown as Request);
}

const ENRICH_PROMPT = (title: string, source: string, text: string, lang: string) => `
You are analyzing a bicycle industry trade article for Pedaling Forward, a trade publication focused on Taiwan's bicycle component supply chain.

Article title: ${title}
Source: ${source}
Language: ${lang}
Content (up to 3000 chars):
${text.slice(0, 3000)}

Write a one-paragraph summary and 3 key trade significance points in the SAME LANGUAGE as the article (${lang}).

Return ONLY valid JSON (no markdown):
{
  "summary": "One paragraph, 2-4 sentences. Focus on the trade/supply chain angle.",
  "keyPoints": [
    "Key point 1 — trade significance for suppliers/shops",
    "Key point 2",
    "Key point 3"
  ]
}
`.trim();

export async function GET(req: NextRequest) {
  if (!(await verifyCron(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    return Response.json({ error: "No Anthropic API key" }, { status: 500 });
  }

  // Enrich analyzed items that have no summary yet; batch capped at 5 for Vercel timeout
  const items = await writeClient.fetch<{
    _id: string; title: string; url: string; sourceName?: string; sourceLanguage?: string; description?: string;
  }[]>(
    `*[_type == "mediaItem" && status == "analyzed" && !defined(summary)][0...5]{
      _id, title, url, sourceName, sourceLanguage, description
    }`,
    {},
    { cache: "no-store" }
  );

  if (!items.length) {
    return Response.json({ ok: true, message: "No items to enrich" });
  }

  const anthropic = new Anthropic({ apiKey });
  let enriched = 0;
  const errors: string[] = [];
  const enrichedTitles: string[] = [];

  for (const item of items) {
    try {
      // Try Firecrawl with a 12s timeout; fall back to RSS snippet
      let fullText = "";
      let fetched = false;

      const scraped = await Promise.race([
        scrapeUrl(item.url),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12_000)),
      ]);
      if (scraped?.markdown) {
        fullText = scraped.markdown;
        fetched = true;
      } else {
        fullText = item.description ?? item.title;
      }

      const prompt = ENRICH_PROMPT(item.title, item.sourceName ?? "unknown", fullText, item.sourceLanguage ?? "en");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        tools: [{
          name: "output_summary",
          description: "Output article summary and key points",
          input_schema: {
            type: "object" as const,
            required: ["summary", "keyPoints"],
            properties: {
              summary:   { type: "string" as const },
              keyPoints: { type: "array" as const, items: { type: "string" as const }, minItems: 1, maxItems: 3 },
            },
          },
        }],
        tool_choice: { type: "tool" as const, name: "output_summary" },
        messages: [{ role: "user", content: prompt }],
      });

      const toolBlock = response.content.find((b) => b.type === "tool_use") as { input: { summary: string; keyPoints: string[] } } | undefined;
      if (!toolBlock) throw new Error("No JSON in response");
      const { summary, keyPoints } = toolBlock.input;

      await writeClient.patch(item._id).set({
        summary,
        keyPoints: (keyPoints ?? []).slice(0, 3),
        fullTextFetched: fetched,
      }).commit();

      enriched++;
      enrichedTitles.push(item.title);
    } catch (err) {
      errors.push(`${item.title}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Telegram notification
  if (enriched > 0) {
    const lines = enrichedTitles.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join("\n");
    const more = enrichedTitles.length > 5 ? `\n+${enrichedTitles.length - 5} more` : "";
    await sendTelegram(
      `📰 <b>情報室 — ${enriched} 篇已摘要完成</b>\n\n${lines}${more}\n\n→ /admin/media`
    );
  }

  return Response.json({ ok: true, enriched, errors });
}
