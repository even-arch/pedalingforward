import { checkAdminAuth, invalidateSettingsCache } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const SETTINGS_ID = "siteSettings";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await writeClient.fetch(
    `*[_type == "siteSettings" && _id == $id][0]{adminPassword, anthropicApiKey, openaiApiKey, firecrawlApiKey, telegramBotToken, telegramChatId, aiWritingRules}`,
    { id: SETTINGS_ID },
    { cache: "no-store" }
  );

  return Response.json(settings ?? {});
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { adminPassword, anthropicApiKey, openaiApiKey, firecrawlApiKey, telegramBotToken, telegramChatId, aiWritingRules } = body as Record<string, string>;

  const patch: Record<string, string> = {};
  if (adminPassword !== undefined) patch.adminPassword = adminPassword;
  if (anthropicApiKey !== undefined) patch.anthropicApiKey = anthropicApiKey;
  if (openaiApiKey !== undefined) patch.openaiApiKey = openaiApiKey;
  if (firecrawlApiKey !== undefined) patch.firecrawlApiKey = firecrawlApiKey;
  if (telegramBotToken !== undefined) patch.telegramBotToken = telegramBotToken;
  if (telegramChatId !== undefined) patch.telegramChatId = telegramChatId;
  if (aiWritingRules !== undefined) patch.aiWritingRules = aiWritingRules;

  if (!Object.keys(patch).length) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  await writeClient.patch(SETTINGS_ID).set(patch).commit();
  invalidateSettingsCache();

  return Response.json({ ok: true });
}
