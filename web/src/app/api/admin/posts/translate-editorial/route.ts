import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth, getAnthropicKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, zh } = await req.json().catch(() => ({})) as { postId?: string; zh?: string };
  if (!postId || !zh?.trim()) {
    return Response.json({ error: "postId and zh required" }, { status: 400 });
  }

  const key = await getAnthropicKey();
  if (!key) return Response.json({ error: "Anthropic API key not configured in siteSettings" }, { status: 503 });

  const client = new Anthropic({ apiKey: key });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
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
      },
    ],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const json = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  const translations = JSON.parse(json) as { en: string; ja: string; de: string };

  // Save all four locales back to Sanity
  await writeClient.patch(postId).set({
    "editorialNote.zh": zh,
    "editorialNote.en": translations.en,
    "editorialNote.ja": translations.ja,
    "editorialNote.de": translations.de,
  }).commit();

  return Response.json({ ok: true, translations });
}
