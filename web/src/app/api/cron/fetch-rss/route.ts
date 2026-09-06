import { NextRequest } from "next/server";
import Parser from "rss-parser";
import { writeClient } from "@/sanity/lib/write-client";

const parser = new Parser({ timeout: 10000 });

function verifyCron(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all enabled sources
  const sources = await writeClient.fetch<
    { _id: string; name: string; url: string; language: string; category: string }[]
  >(`*[_type == "mediaSource" && enabled == true]{_id, name, url, language, category}`);

  if (!sources.length) {
    return Response.json({ ok: true, message: "No enabled sources" });
  }

  // Load existing URLs to dedup
  const existingUrls = await writeClient.fetch<string[]>(
    `*[_type == "mediaItem"].url`
  );
  const seen = new Set(existingUrls);

  let totalNew = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      const now = new Date().toISOString();

      for (const item of (feed.items ?? []).slice(0, 20)) {
        const url = item.link ?? item.guid;
        if (!url || seen.has(url)) continue;
        seen.add(url);

        await writeClient.create({
          _type: "mediaItem",
          title: item.title ?? "(no title)",
          url,
          sourceName: source.name,
          sourceLanguage: source.language,
          description: item.contentSnippet ?? item.summary ?? "",
          publishedAt: item.isoDate ?? now,
          fetchedAt: now,
          status: "raw",
        });
        totalNew++;
      }

      // Update lastFetchedAt on the source
      await writeClient.patch(source._id).set({ lastFetchedAt: new Date().toISOString() }).commit();
    } catch (err) {
      errors.push(`${source.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return Response.json({ ok: true, totalNew, errors });
}
