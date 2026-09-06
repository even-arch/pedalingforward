import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { writeClient } from "@/sanity/lib/write-client";
import { getAnthropicKey } from "@/lib/admin";

function verifyCron(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

const SYSTEM_PROMPT = `You are an editorial filter for Pedaling Forward, a trade publication focused on the global bicycle component supply chain, particularly from a Taiwan/Asia manufacturer perspective.

Score each article 0-10 for relevance:
8-10: Highly relevant — supply chain news, component specs/launches, OEM/ODM market moves, industry mergers, sourcing, Taiwan/China manufacturing
5-7: Relevant — retailer/distributor news, product reviews with strong trade angle, standards changes
3-4: Marginally relevant — general cycling culture with minor industry angle
0-2: Not relevant — pure race results, fitness lifestyle, mainstream consumer reviews without trade angle

Return a JSON array matching the input order:
[{"score": 7, "reason": "one sentence why"}, ...]`;

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
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

  // Process in batches of 10
  const BATCH = 10;
  let processed = 0;
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
        messages: [{ role: "user", content: `Score these ${batch.length} articles:\n\n${prompt}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array in response");

      const scores: { score: number; reason: string }[] = JSON.parse(jsonMatch[0]);

      for (let j = 0; j < batch.length; j++) {
        const { score, reason } = scores[j] ?? { score: 0, reason: "parse error" };
        const status = score >= 6 ? "collected" : score >= 4 ? "dismissed" : "filtered_out";
        await writeClient
          .patch(batch[j]._id)
          .set({ relevanceScore: score, relevanceReason: reason, status })
          .commit();
        processed++;
      }
    } catch (err) {
      errors.push(`batch ${i / BATCH}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return Response.json({ ok: true, processed, errors });
}
