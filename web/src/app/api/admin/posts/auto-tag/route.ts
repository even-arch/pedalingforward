import { checkAdminAuth, getAnthropicKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are tagging published articles for Pedaling Forward, a B2B trade publication about Taiwan's bicycle component industry, written for overseas bike shops and distributors.

Assign 1-5 tags from this list only (use the exact slug values). Pick what truly fits — do not force tags.

Topic tags:
- supply-chain: OEM/ODM, sourcing, manufacturing, factories, components supply
- product-launch: new product announcements, spec releases, debuts
- market-news: mergers, acquisitions, company news, market trends, financials
- regulation: standards, safety rules, trade policy, tariffs, import/export
- trade-show: Eurobike, Taipei Cycle, Sea Otter, Interbike, industry exhibitions
- retail: bike shops, distributors, dealers, retail chains
- tech: technology specs, materials, engineering, R&D, testing
- e-bike: electric bikes, motors, batteries, charging
- urban: city cycling, bike lanes, commuting, cycling promotion, local government
- cargo-bike: cargo bikes, utility bikes, last-mile delivery
- gravel: gravel bikes, adventure cycling, bikepacking
- mtb: mountain bikes, trail riding, enduro, DH
- road: road racing, road bikes, gran fondo, criterium

Brand tags (use if article is primarily about this brand):
- shimano: Shimano components, groupsets, Di2, fishing gear articles → DO NOT tag
- sram: SRAM drivetrains, RED, Force, Rival, AXS
- bosch: Bosch eBike systems, motors
- trek: Trek bicycles
- giant: Giant bicycles
- specialized: Specialized bicycles
- merida: Merida bicycles

Tech component tags (use if article focuses on this component type):
- carbon-fiber: carbon frames, carbon components, composite materials
- hydraulic-brakes: disc brakes, hydraulic brake systems
- suspension: forks, rear shocks, suspension systems
- derailleur: derailleurs, shifting systems
- frame: frame design, geometry, frame manufacturing

Return a JSON array matching the input order, one object per article:
[{"mediaTags": ["supply-chain", "shimano"]}, {"mediaTags": ["e-bike", "bosch"]}, ...]`;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    return Response.json({ error: "尚未設定 Anthropic API key — 請到 Admin → 系統設定 填入" }, { status: 500 });
  }

  // Fetch published posts without mediaTags (or empty)
  const posts = await writeClient.fetch<{
    _id: string;
    title?: string;
    excerpt?: string;
  }[]>(
    `*[_type == "post" && defined(publishedAt) && (!(defined(mediaTags)) || count(mediaTags) == 0)] {
      _id,
      "title": coalesce(title.en, title.zh, "untitled"),
      "excerpt": coalesce(excerpt.en, excerpt.zh, "")
    } | order(publishedAt desc)`,
    {},
    { cache: "no-store" }
  );

  if (!posts.length) {
    return Response.json({ ok: true, message: "所有已發布文章都已有標籤", tagged: 0 });
  }

  const anthropic = new Anthropic({ apiKey });
  const BATCH = 8;
  let tagged = 0;
  const errors: string[] = [];

  for (let i = 0; i < posts.length; i += BATCH) {
    const batch = posts.slice(i, i + BATCH);
    const prompt = batch
      .map((p, idx) =>
        `${idx + 1}. Title: "${p.title}"\nExcerpt: ${p.excerpt ?? "(none)"}`
      )
      .join("\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Tag these ${batch.length} articles:\n\n${prompt}` }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array in response");

      const results: { mediaTags: string[] }[] = JSON.parse(jsonMatch[0]);

      await Promise.all(
        batch.map((post, j) => {
          const tags = (results[j]?.mediaTags ?? []).filter(Boolean);
          if (!tags.length) return Promise.resolve();
          return writeClient.patch(post._id).set({ mediaTags: tags }).commit();
        })
      );
      tagged += batch.length;
    } catch (err) {
      errors.push(`batch ${Math.floor(i / BATCH) + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return Response.json({ ok: true, tagged, total: posts.length, errors });
}
