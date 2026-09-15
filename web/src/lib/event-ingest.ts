import { db } from "./db";
import { client } from "@/sanity/client";

// Country keyword detection from article title
const COUNTRY_PATTERNS: [string, RegExp][] = [
  ["USA", /\b(United States|American|U\.S\.|US |Biden|Trump|Washington)\b/i],
  ["DEU", /\b(German[y]?|Berlin)\b/i],
  ["JPN", /\b(Japan(ese)?|Tokyo)\b/i],
  ["TWN", /\b(Taiwan(ese)?)\b/i],
  ["CHN", /\b(China|Chinese|Beijing)\b/i],
  ["NLD", /\b(Netherlands|Dutch|Holland)\b/i],
  ["GBR", /\b(British|Britain|UK |England)\b/i],
  ["ITA", /\b(Italian|Italy)\b/i],
  ["VNM", /\b(Vietnam(ese)?)\b/i],
  ["POL", /\b(Poland|Polish)\b/i],
  ["FRA", /\b(France|French)\b/i],
  ["BEL", /\b(Belgium|Belgian)\b/i],
  ["AUT", /\b(Austria[n]?)\b/i],
  ["ESP", /\b(Spain|Spanish)\b/i],
  ["KOR", /\b(Korea[n]?|Seoul)\b/i],
];

function countriesFromTitle(title: string): string[] {
  return COUNTRY_PATTERNS.filter(([, re]) => re.test(title)).map(([code]) => code);
}

// Tag classification from article text
const TAG_RULES: { keywords: string[]; tag: string }[] = [
  { keywords: ["tariff", "duty", "customs", "trade policy", "trade war", "anti-dumping"], tag: "tariff" },
  { keywords: ["supply chain", "disruption", "shortage", "factory", "manufacturer", "production"], tag: "supply_chain" },
  { keywords: ["demand", "recession", "pandemic", "consumer", "sales", "market"], tag: "demand_collapse" },
  { keywords: ["ebike", "e-bike", "electric bicycle", "electric bike", "regulation", "emission"], tag: "demand_shift" },
];

function classifyTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags = TAG_RULES.filter((r) => r.keywords.some((k) => lower.includes(k))).map((r) => r.tag);
  return tags.length > 0 ? [...new Set(tags)] : ["general"];
}

type MediaItem = {
  _id: string;
  title: string;
  url: string;
  publishedAt: string;
  sourceName?: string;
  description?: string;
};

export type EventIngestResult = { query: string; fetched: number; saved: number; error?: string };

// Replace GDELT with Sanity mediaItem (RSS-sourced articles).
// Advantages over GDELT:
//  - Dates from RSS pub dates → reliable, no future articles
//  - Sources curated by us → relevant to bicycle industry
//  - No external API quota or dependency
export async function ingestSanityEvents(opts: {
  fromDate?: Date;
}): Promise<EventIngestResult[]> {
  const now = new Date();
  const fromDate = opts.fromDate ?? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let items: MediaItem[] = [];
  try {
    items = await client.fetch<MediaItem[]>(
      `*[_type == "mediaItem"
          && dateTime(publishedAt) >= dateTime($from)
          && dateTime(publishedAt) <= dateTime($now)
        ] | order(publishedAt desc) [0...400] {
          _id, title, url, publishedAt, sourceName, description
        }`,
      { from: fromDate.toISOString(), now: now.toISOString() }
    );
  } catch (err) {
    return [{ query: "Sanity mediaItem", fetched: 0, saved: 0, error: String(err) }];
  }

  let saved = 0;
  for (const item of items) {
    if (!item.url || !item.title) continue;

    const eventDate = new Date(item.publishedAt);
    // Belt-and-suspenders: never save future-dated events
    if (eventDate > now) continue;

    const exists = await db.globalEvent.findFirst({ where: { url: item.url }, select: { id: true } });
    if (exists) continue;

    const text = `${item.title} ${item.description ?? ""}`;
    const countries = countriesFromTitle(item.title);
    const tags = classifyTags(text);

    await db.globalEvent.create({
      data: {
        source: "rss",
        eventDate,
        title: item.title.slice(0, 500),
        url: item.url,
        tone: null,
        countries,
        industries: ["bicycle"],
        tags,
      },
    });
    saved++;
  }

  await db.systemMeta.upsert({
    where: { key: "gdelt_last_ingest" },
    update: { value: now.toISOString() },
    create: { key: "gdelt_last_ingest", value: now.toISOString() },
  }).catch(() => {});

  return [{ query: "Sanity mediaItem (RSS sources)", fetched: items.length, saved }];
}

// Re-tag existing events that have sparse country data
export async function retagEventCountries(): Promise<{ updated: number }> {
  const events = await db.globalEvent.findMany({
    select: { id: true, title: true, countries: true },
  });
  let updated = 0;
  for (const ev of events) {
    const extra = countriesFromTitle(ev.title);
    const merged = [...new Set([...ev.countries, ...extra])];
    if (merged.length !== ev.countries.length || merged.some((c) => !ev.countries.includes(c))) {
      await db.globalEvent.update({ where: { id: ev.id }, data: { countries: merged } });
      updated++;
    }
  }
  return { updated };
}
