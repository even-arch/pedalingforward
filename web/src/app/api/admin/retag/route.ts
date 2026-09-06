import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey } from "@/lib/admin";

const TAG_PROMPT = `You are tagging bicycle industry news articles for Pedaling Forward, a trade publication focused on Taiwan's bicycle component supply chain.

Assign 1-3 tags from this list only (use the exact values):
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
[{"tags": ["supply-chain", "market-news"]}, ...]`;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    return Response.json({ error: "No Anthropic API key configured" }, { status: 500 });
  }

  // Get all analyzed + collected items without tags (or with empty tags)
  const items = await writeClient.fetch<{ _id: string; title: string; description?: string; sourceName?: string }[]>(
    `*[_type == "mediaItem" && status in ["analyzed", "collected"] && (!(defined(tags)) || count(tags) == 0)][0...100]{_id, title, description, sourceName}`,
    {},
    { cache: "no-store" }
  );

  if (!items.length) {
    return Response.json({ ok: true, message: "全部文章都已有標籤", tagged: 0 });
  }

  const anthropic = new Anthropic({ apiKey });
  const BATCH = 10;
  let tagged = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const prompt = batch
      .map((it, idx) => `${idx + 1}. "${it.title}" (${it.sourceName ?? "unknown"})\n${it.description ?? ""}`)
      .join("\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: TAG_PROMPT,
        messages: [{ role: "user", content: `Tag these ${batch.length} articles:\n\n${prompt}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array in response");

      const results: { tags: string[] }[] = JSON.parse(jsonMatch[0]);

      await Promise.all(
        batch.map((item, j) =>
          writeClient.patch(item._id).set({ tags: results[j]?.tags ?? [] }).commit()
        )
      );
      tagged += batch.length;
    } catch (err) {
      errors.push(`batch ${i / BATCH}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return Response.json({ ok: true, tagged, errors });
}
