import { db } from "./db";
import { client } from "@/sanity/client";

// sourceRegion (2-letter ISO or region marker) → our 3-letter country code
const REGION_TO_CODE: Record<string, string> = {
  DE: "DEU", AT: "AUT", CH: "CHE", NL: "NLD", BE: "BEL", FR: "FRA",
  IT: "ITA", ES: "ESP", PL: "POL", DK: "DNK", SE: "SWE", FI: "FIN",
  GB: "GBR", UK: "GBR",
  US: "USA", CA: "CAN", AU: "AUS",
  TW: "TWN", CN: "CHN", JP: "JPN", KR: "KOR", VN: "VNM", TH: "THA",
  // EU = pan-European (keep as-is for now)
};

// filter-media geo tags (lowercase country names) → 3-letter codes
const GEO_TAG_TO_CODE: Record<string, string> = {
  taiwan: "TWN", japan: "JPN", china: "CHN", germany: "DEU",
  netherlands: "NLD", uk: "GBR", us: "USA", france: "FRA",
  italy: "ITA", belgium: "BEL", denmark: "DNK", sweden: "SWE",
  poland: "POL", vietnam: "VNM", korea: "KOR", austria: "AUT",
};

// Sanity mediaItem tags → GlobalEvent tags
// (Sanity: hyphenated; GlobalEvent: underscore-delimited)
const SANITY_TO_EVENT_TAG: Record<string, string> = {
  "supply-chain":  "supply_chain",
  "regulation":    "tariff",
  "e-bike":        "demand_shift",
  "urban":         "demand_shift",
  "cargo-bike":    "demand_shift",
  "product-launch":"general",
  "market-news":   "general",
  "trade-show":    "general",
  "retail":        "demand_collapse",
  "tech":          "general",
  "gravel":        "general",
  "mtb":           "general",
  "road":          "general",
};

type MediaItem = {
  _id: string;
  title: string;
  url: string;
  publishedAt?: string;
  fetchedAt?: string;
  sourceName?: string;
  sourceRegion?: string;
  tags?: string[];       // already set by filter-media AI
  summary?: string;
  description?: string;
};

export type EventIngestResult = { query: string; fetched: number; saved: number; error?: string };

export async function ingestSanityEvents(opts: {
  fromDate?: Date;
}): Promise<EventIngestResult[]> {
  const now = new Date();
  const fromDate = opts.fromDate ?? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let items: MediaItem[] = [];
  try {
    // Include raw items too — sourceRegion is always set, tags may be absent on raw.
    // Date filter: publishedAt must exist AND be in the past (no future articles).
    items = await client.fetch<MediaItem[]>(
      `*[_type == "mediaItem"
          && status != "dismissed"
          && defined(publishedAt)
          && dateTime(publishedAt) >= dateTime($from)
          && dateTime(publishedAt) <= dateTime($now)
        ] | order(publishedAt desc) [0...500] {
          _id, title, url, publishedAt, fetchedAt, sourceName, sourceRegion, tags, summary, description
        }`,
      { from: fromDate.toISOString(), now: now.toISOString() }
    );
  } catch (err) {
    return [{ query: "Sanity mediaItem", fetched: 0, saved: 0, error: String(err) }];
  }

  let saved = 0;
  for (const item of items) {
    if (!item.url || !item.title) continue;

    // Use publishedAt; fall back to fetchedAt; reject if still future
    const rawDate = item.publishedAt ?? item.fetchedAt;
    if (!rawDate) continue;
    const eventDate = new Date(rawDate);
    if (isNaN(eventDate.getTime()) || eventDate > now) continue;

    const exists = await db.globalEvent.findFirst({ where: { url: item.url }, select: { id: true } });
    if (exists) continue;

    // Countries: sourceRegion first, then any geo tags set by filter-media
    const countrySet = new Set<string>();
    if (item.sourceRegion) {
      const code = REGION_TO_CODE[item.sourceRegion.toUpperCase()];
      if (code) countrySet.add(code);
      else if (item.sourceRegion !== "EU") countrySet.add(item.sourceRegion);
    }
    for (const tag of item.tags ?? []) {
      const code = GEO_TAG_TO_CODE[tag.toLowerCase()];
      if (code) countrySet.add(code);
    }

    // Tags: map Sanity tags to GlobalEvent tag vocabulary
    const eventTags = [...new Set(
      (item.tags ?? [])
        .map((t) => SANITY_TO_EVENT_TAG[t] ?? null)
        .filter((t): t is string => t !== null)
    )];

    await db.globalEvent.create({
      data: {
        source: "rss",
        eventDate,
        title: item.title.slice(0, 500),
        url: item.url,
        tone: null,
        countries: [...countrySet],
        industries: ["bicycle"],
        tags: eventTags.length > 0 ? eventTags : ["general"],
      },
    });
    saved++;
  }

  await db.systemMeta.upsert({
    where: { key: "gdelt_last_ingest" },
    update: { value: now.toISOString() },
    create: { key: "gdelt_last_ingest", value: now.toISOString() },
  }).catch(() => {});

  return [{ query: "Sanity mediaItem (status:analyzed/collected)", fetched: items.length, saved }];
}

// Re-tag existing events from title keywords (fallback for legacy data)
export async function retagEventCountries(): Promise<{ updated: number }> {
  // Simple keyword patterns for retroactive country tagging
  const patterns: [string, RegExp][] = [
    ["TWN", /\bTaiwan(ese)?\b/i], ["CHN", /\b(China|Chinese|Beijing)\b/i],
    ["DEU", /\b(German[y]?|Berlin)\b/i], ["USA", /\b(United States|American|U\.S\.)\b/i],
    ["JPN", /\b(Japan(ese)?|Tokyo)\b/i], ["NLD", /\b(Netherlands|Dutch)\b/i],
    ["GBR", /\b(British|Britain|UK |England)\b/i], ["ITA", /\b(Italian|Italy)\b/i],
    ["VNM", /\b(Vietnam(ese)?)\b/i],
  ];

  const events = await db.globalEvent.findMany({ select: { id: true, title: true, countries: true } });
  let updated = 0;
  for (const ev of events) {
    const extra = patterns.filter(([, re]) => re.test(ev.title)).map(([code]) => code);
    const merged = [...new Set([...ev.countries, ...extra])];
    if (merged.length !== ev.countries.length || merged.some((c) => !ev.countries.includes(c))) {
      await db.globalEvent.update({ where: { id: ev.id }, data: { countries: merged } });
      updated++;
    }
  }
  return { updated };
}
