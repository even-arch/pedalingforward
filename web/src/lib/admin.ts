import { createClient } from "next-sanity";

const readClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-09-02",
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

let cachedPassword: string | null = null;
let cachedApiKey: string | null = null;
let cachedOpenAIKey: string | null = null;

async function getSettings() {
  return readClient.fetch<{adminPassword?: string; anthropicApiKey?: string; openaiApiKey?: string; firecrawlApiKey?: string; telegramBotToken?: string; telegramChatId?: string; aiWritingRules?: string}>(
    `*[_type == "siteSettings"][0]{adminPassword, anthropicApiKey, openaiApiKey, firecrawlApiKey, telegramBotToken, telegramChatId, aiWritingRules}`,
    {},
    { cache: "no-store" }
  );
}

export async function getAdminPassword(): Promise<string | null> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (cachedPassword) return cachedPassword;
  const settings = await getSettings();
  cachedPassword = settings?.adminPassword ?? null;
  return cachedPassword;
}

export async function getAnthropicKey(): Promise<string | null> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  if (cachedApiKey) return cachedApiKey;
  const settings = await getSettings();
  cachedApiKey = settings?.anthropicApiKey ?? null;
  return cachedApiKey;
}

export async function getOpenAIKey(): Promise<string | null> {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  if (cachedOpenAIKey) return cachedOpenAIKey;
  const settings = await getSettings();
  cachedOpenAIKey = settings?.openaiApiKey ?? null;
  return cachedOpenAIKey;
}

export async function getAiWritingRules(): Promise<string> {
  const settings = await getSettings();
  return settings?.aiWritingRules ?? "Write concise, professional trade news for the global bicycle industry.";
}

export async function checkAdminAuth(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const provided = authHeader.slice(7).trim();
  if (!provided) return false;
  const correct = await getAdminPassword();
  if (!correct) return false;
  return provided === correct;
}

export function invalidateSettingsCache() {
  cachedPassword = null;
  cachedApiKey = null;
  cachedOpenAIKey = null;
}
