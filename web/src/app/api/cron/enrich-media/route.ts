import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { writeClient } from "@/sanity/lib/write-client";
import { getAnthropicKey } from "@/lib/admin";
import { scrapeUrl } from "@/lib/firecrawl";
import { sendTelegram } from "@/lib/telegram";

function verifyCron(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
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
  if (!verifyCron(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    return Response.json({ error: "No Anthropic API key" }, { status: 500 });
  }

  // Get collected items that haven't been enriched yet (no summary)
  const items = await writeClient.fetch<{
    _id: string; title: string; url: string; sourceName?: string; sourceLanguage?: string; description?: string;
  }[]>(
    `*[_type == "mediaItem" && status == "collected" && !defined(summary)][0...20]{
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
      // Try Firecrawl first; fall back to RSS snippet
      let fullText = "";
      let fetched = false;

      const scraped = await scrapeUrl(item.url);
      if (scraped?.markdown) {
        fullText = scraped.markdown;
        fetched = true;
      } else {
        fullText = item.description ?? item.title;
      }

      const prompt = ENRICH_PROMPT(item.title, item.sourceName ?? "unknown", fullText, item.sourceLanguage ?? "en");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");

      const { summary, keyPoints } = JSON.parse(jsonMatch[0]) as { summary: string; keyPoints: string[] };

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
      `📰 <b>情報室 — ${enriched} 篇草稿已就緒</b>\n\n${lines}${more}\n\n→ /admin/media`
    );
  }

  return Response.json({ ok: true, enriched, errors });
}
