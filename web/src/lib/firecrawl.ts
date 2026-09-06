import { createClient } from "next-sanity";

const readClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-09-02",
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

async function getFirecrawlKey(): Promise<string | null> {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY;
  const s = await readClient.fetch<{firecrawlApiKey?: string}>(
    `*[_type == "siteSettings"][0]{firecrawlApiKey}`,
    {},
    { cache: "no-store" }
  );
  return s?.firecrawlApiKey ?? null;
}

export type ScrapeResult = {
  title: string;
  markdown: string;
  publishedAt?: string;
};

export async function scrapeUrl(url: string): Promise<ScrapeResult | null> {
  const key = await getFirecrawlKey();
  if (!key) return null;

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.data?.metadata?.title ?? "",
      markdown: data.data?.markdown ?? "",
      publishedAt: data.data?.metadata?.publishedTime,
    };
  } catch {
    return null;
  }
}

// Resolve Google News redirect to original URL
export async function resolveGoogleNewsUrl(gnUrl: string): Promise<string> {
  try {
    const res = await fetch(gnUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    return res.url !== gnUrl ? res.url : gnUrl;
  } catch {
    return gnUrl;
  }
}
