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
        tools: [{
          name: "output_tags",
          description: "Output relevance and tags for each article",
          input_schema: {
            type: "object" as const,
            required: ["results"],
            properties: {
              results: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  required: ["relevant", "tags"],
                  properties: {
                    relevant: { type: "boolean" as const },
                    tags: { type: "array" as const, items: { type: "string" as const } },
                  },
                },
              },
            },
          },
        }],
        tool_choice: { type: "tool" as const, name: "output_tags" },
        messages: [{ role: "user", content: `Tag these ${batch.length} articles:\n\n${prompt}` }],
      });

      const toolBlock = response.content.find((b) => b.type === "tool_use") as { input: { results: { relevant: boolean; tags: string[] }[] } } | undefined;
      if (!toolBlock) throw new Error("No JSON array in response");
      const results: { relevant: boolean; tags: string[] }[] = toolBlock.input.results;

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

  // Cluster newly analyzed items by signal-tag overlap + date proximity
  const clustered = await clusterAnalyzedItems();

  return Response.json({ ok: true, analyzed, dismissed, clustered, errors });
}

// Tags that carry no topical signal — excluded from cluster matching
const GEO_TAGS = new Set([
  "taiwan", "japan", "china", "germany", "netherlands", "uk", "us",
  "france", "italy", "belgium", "denmark", "sweden",
]);

function signalTags(tags: string[]): string[] {
  return tags.filter((t) => !GEO_TAGS.has(t));
}

function signalOverlap(a: string[], b: string[]): number {
  const sa = new Set(signalTags(a));
  return signalTags(b).filter((t) => sa.has(t)).length;
}

async function clusterAnalyzedItems(): Promise<number> {
  const items = await writeClient.fetch<{ _id: string; tags?: string[]; publishedAt?: string; _createdAt: string }[]>(
    `*[_type == "mediaItem" && status == "analyzed" && !defined(clusterGroup)]{_id, tags, publishedAt, _createdAt}`,
    {},
    { cache: "no-store" }
  );
  if (!items.length) return 0;

  const sorted = [...items].sort((a, b) => {
    const da = new Date(a.publishedAt ?? a._createdAt).getTime();
    const db = new Date(b.publishedAt ?? b._createdAt).getTime();
    return da - db;
  });

  type Cluster = { groupId: string; tags: string[]; minMs: number; maxMs: number; ids: string[] };
  const clusters: Cluster[] = [];

  for (const item of sorted) {
    const ms = new Date(item.publishedAt ?? item._createdAt).getTime();
    const tags = item.tags ?? [];
    let matched = false;

    for (const c of clusters) {
      const daysDiff = Math.max(Math.abs(ms - c.minMs), Math.abs(ms - c.maxMs)) / 86_400_000;
      if (daysDiff <= 7 && signalOverlap(tags, c.tags) >= 2) {
        c.ids.push(item._id);
        c.tags = [...new Set([...c.tags, ...tags])];
        if (ms < c.minMs) c.minMs = ms;
        if (ms > c.maxMs) c.maxMs = ms;
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({ groupId: crypto.randomUUID(), tags, minMs: ms, maxMs: ms, ids: [item._id] });
    }
  }

  const tx = writeClient.transaction();
  for (const { groupId, ids } of clusters) {
    for (const id of ids) {
      tx.patch(id, { set: { clusterGroup: groupId } });
    }
  }
  await tx.commit();

  return items.length;
}
