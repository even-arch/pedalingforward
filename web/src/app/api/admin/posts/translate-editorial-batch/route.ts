import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth, getAnthropicKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

async function translateZh(client: Anthropic, zh: string): Promise<{ en: string; ja: string; de: string }> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `You are translating one short sentence for a Taiwanese bicycle industry media site.
This is an "editor's take" — a concise editorial judgment on an industry news item.
Keep the same direct, opinionated tone. One sentence per language.
Respond ONLY with a JSON object, no markdown.

Source (Traditional Chinese): ${zh}

Output:
{
  "en": "<English>",
  "ja": "<Japanese>",
  "de": "<German>"
}`,
    }],
  });
  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const json = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(json);
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = await getAnthropicKey();
  if (!key) return Response.json({ error: "Anthropic API key not configured" }, { status: 503 });

  // Fetch all posts (published + draft) that have any editorialNote value
  const posts = await writeClient.fetch<{
    _id: string;
    status: string;
    // Sanity returns the raw value — could be old string or new object
    editorialNote: unknown;
  }[]>(
    `*[_type == "post" && defined(editorialNote)]{ _id, status, editorialNote }`,
    {},
    { cache: "no-store" }
  );

  const claude = new Anthropic({ apiKey: key });
  const results = { translated: 0, skipped: 0, errors: [] as string[] };

  for (const post of posts) {
    const note = post.editorialNote;

    // Determine zh source text
    let zh: string | null = null;
    let hasEn = false;

    if (typeof note === "string") {
      // Old format: plain string — treat as zh
      zh = note.trim();
      hasEn = false;
    } else if (note && typeof note === "object") {
      const obj = note as Record<string, string>;
      zh = obj.zh?.trim() ?? null;
      hasEn = !!obj.en?.trim();
    }

    if (!zh) { results.skipped++; continue; }
    if (hasEn) { results.skipped++; continue; } // already translated

    try {
      const translations = await translateZh(claude, zh);

      await writeClient.patch(post._id).set({
        "editorialNote.zh": zh,
        "editorialNote.en": translations.en,
        "editorialNote.ja": translations.ja,
        "editorialNote.de": translations.de,
      }).commit();

      results.translated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.errors.push(`${post._id}: ${msg}`);
    }
  }

  return Response.json({ ok: true, ...results, total: posts.length });
}
