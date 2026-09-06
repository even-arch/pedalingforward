import { createClient } from "next-sanity";

const readClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-09-02",
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

async function getTelegramConfig(): Promise<{botToken?: string; chatId?: string}> {
  const s = await readClient.fetch<{telegramBotToken?: string; telegramChatId?: string}>(
    `*[_type == "siteSettings"][0]{telegramBotToken, telegramChatId}`,
    {},
    { cache: "no-store" }
  );
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? s?.telegramBotToken,
    chatId: process.env.TELEGRAM_CHAT_ID ?? s?.telegramChatId,
  };
}

export async function sendTelegram(text: string): Promise<boolean> {
  const { botToken, chatId } = await getTelegramConfig();
  if (!botToken || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
