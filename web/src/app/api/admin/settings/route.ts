import { checkAdminAuth, invalidateSettingsCache } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const SETTINGS_ID = "siteSettings";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await writeClient.fetch(
    `*[_type == "siteSettings" && _id == $id][0]{adminPassword, anthropicApiKey, aiWritingRules}`,
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
  const { adminPassword, anthropicApiKey, aiWritingRules } = body as Record<string, string>;

  const patch: Record<string, string> = {};
  if (adminPassword !== undefined) patch.adminPassword = adminPassword;
  if (anthropicApiKey !== undefined) patch.anthropicApiKey = anthropicApiKey;
  if (aiWritingRules !== undefined) patch.aiWritingRules = aiWritingRules;

  if (!Object.keys(patch).length) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  await writeClient.patch(SETTINGS_ID).set(patch).commit();
  invalidateSettingsCache();

  return Response.json({ ok: true });
}
