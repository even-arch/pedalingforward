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

const SYSTEM_PROMPT = `You are a content tagger for Pedaling Forward, a trade publication about the global bicycle industry.

Your only job per article:
1. Decide if it is about BICYCLES (including e-bikes, cargo bikes, cycling infrastructure, bike components, bike retail). If it mentions motorcycles, mopeds, or scooters with no bicycle angle → NOT relevant.
2. If relevant: assign as many accurate tags as apply. Be generous — tags are used for search and filtering.

Tag categories to consider (use these exact values where they fit):
TOPIC: supply-chain, product-launch, market-news, regulation, trade-show, retail, tech, e-bike, urban, cargo-bike, gravel, mtb, road
BRANDS: shimano, sram, campagnolo, bosch, brose, mahle, trek, giant, specialized, cannondale, scott, cube, canyon, merida, bianchi, pinarello, colnago — add any other brand name you recognise (lowercase, hyphenated if needed)
GEO (in addition to sourceRegion): taiwan, japan, china, germany, netherlands, uk, us, france, italy, belgium, denmark, sweden — only add if clearly the geographic focus of the article
TECH TERMS: carbon-fiber, aluminum, titanium, hydraulic-brakes, dropper-post, suspension, derailleur, chainring, cassette, hub, rim, tire, saddle, handlebar, frame

Return a JSON array matching the input order:
[{"relevant": true, "tags": ["supply-chain", "shimano", "japan"]}, ...]

If not relevant: {"relevant": false, "tags": []}`;

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
  let analyzed = 0;
  let dismissed = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const prompt = batch
      .map((it, idx) => `${idx + 1}. "${it.title}" (${it.sourceName ?? "unknown"})\n${it.description ?? ""}`)
      .join("\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Tag these ${batch.length} articles:\n\n${prompt}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array in response");

      const results: { relevant: boolean; tags: string[] }[] = JSON.parse(jsonMatch[0]);

      for (let j = 0; j < batch.length; j++) {
        const { relevant, tags } = results[j] ?? { relevant: false, tags: [] };
        const status = relevant ? "analyzed" : "dismissed";
        await writeClient
          .patch(batch[j]._id)
          .set({ status, tags: tags ?? [] })
          .commit();
        if (relevant) analyzed++; else dismissed++;
      }
    } catch (err) {
      errors.push(`batch ${i / BATCH}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return Response.json({ ok: true, analyzed, dismissed, errors });
}
