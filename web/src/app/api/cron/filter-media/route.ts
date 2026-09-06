import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { writeClient } from "@/sanity/lib/write-client";
import { getAnthropicKey, checkAdminAuth } from "@/lib/admin";

async function verifyCron(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return checkAdminAuth(req as unknown as Request);
}

const SYSTEM_PROMPT = `You are an editorial filter for Pedaling Forward, a trade publication focused on the global bicycle component supply chain, particularly from a Taiwan/Asia manufacturer perspective.

Score each article 0-10 for relevance:
8-10: Highly relevant — supply chain news, component specs/launches, OEM/ODM market moves, industry mergers, sourcing, Taiwan/China manufacturing, tariffs/trade policy
5-7: Relevant — retailer/distributor news, product reviews with strong trade angle, standards changes, trade shows
3-4: Marginally relevant — general cycling industry news with minor trade angle
0-2: Not relevant — pure race results, fitness lifestyle, consumer product reviews without trade angle

Also assign 1-3 tags from this list (pick only what truly applies):
- supply-chain: sourcing, OEM/ODM, manufacturing, factory, components supply
- product-launch: new product announcements, spec releases
- market-news: mergers, acquisitions, company news, market trends
- regulation: standards, safety rules, trade policy, tariffs, import/export
- trade-show: Eurobike, Taipei Cycle, Sea Otter, industry exhibitions
- retail: bike shops, distributors, dealers, retail chains
- tech: technology specs, materials, engineering, testing
- e-bike: electric bikes, motors, batteries
- urban: city cycling infrastructure, bike lanes, cycling promotion, local government cycling policies

Return a JSON array matching the input order:
[{"score": 7, "reason": "one sentence why", "tags": ["supply-chain", "market-news"]}, ...]`;

export async function GET(req: NextRequest) {
  if (!(await verifyCron(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    return Response.json({ error: "No Anthropic API key configured" }, { status: 500 });
  }

  const items = await writeClient.fetch<
    { _id: string; title: string; description?: string; sourceName?: string }[]
  >(`*[_type == "mediaItem" && status == "raw"][0...50]{_id, title, description, sourceName}`);

  if (!items.length) {
    return Response.json({ ok: true, message: "No raw items to filter" });
  }

  const anthropic = new Anthropic({ apiKey });

  const BATCH = 10;
  let processed = 0;
  let dismissed = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const prompt = batch
      .map((it, idx) => `${idx + 1}. "${it.title}" (${it.sourceName ?? "unknown source"})\n${it.description ?? ""}`)
      .join("\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Score and tag these ${batch.length} articles:\n\n${prompt}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array in response");

      const scores: { score: number; reason: string; tags?: string[] }[] = JSON.parse(jsonMatch[0]);

      for (let j = 0; j < batch.length; j++) {
        const { score, reason, tags } = scores[j] ?? { score: 0, reason: "parse error", tags: [] };
        // ≥3 → analyzed (human reviews and selects), <3 → auto-dismissed
        const status = score >= 3 ? "analyzed" : "dismissed";
        await writeClient
          .patch(batch[j]._id)
          .set({ relevanceScore: score, relevanceReason: reason, status, tags: tags ?? [] })
          .commit();
        processed++;
        if (status === "dismissed") dismissed++;
      }
    } catch (err) {
      errors.push(`batch ${i / BATCH}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return Response.json({ ok: true, processed, dismissed, analyzed: processed - dismissed, errors });
}
