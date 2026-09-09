import { db } from "./db";

const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

// Bicycle trade industry queries → tag mapping
const QUERY_GROUPS = [
  { q: "bicycle tariff import export trade policy",    tags: ["tariff"] },
  { q: "bicycle cycling supply chain disruption",      tags: ["supply_chain"] },
  { q: "bicycle demand market recession pandemic",     tags: ["demand_collapse"] },
  { q: "Taiwan bicycle manufacturer cycling export",   tags: ["supply_chain"] },
  { q: "ebike electric bicycle regulation market",     tags: ["demand_shift"] },
];

// Map GDELT 2-letter ISO → our 3-letter country codes
const COUNTRY_MAP: Record<string, string> = {
  US: "USA", DE: "DEU", JP: "JPN", GB: "GBR", NL: "NLD",
  TW: "TWN", CN: "CHN", IT: "ITA", VN: "VNM", PL: "POL",
  FR: "FRA", BE: "BEL", CH: "CHE", AU: "AUS", CA: "CAN",
};

// Extract countries mentioned in article title (supplements sourcecountry which is publishing country)
const TITLE_KEYWORDS: [string, RegExp][] = [
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
];

function countriesFromTitle(title: string): string[] {
  const found: string[] = [];
  for (const [code, re] of TITLE_KEYWORDS) {
    if (re.test(title)) found.push(code);
  }
  return found;
}

type GdeltArticle = {
  url?: string; title?: string; seendate?: string;
  sourcecountry?: string; tone?: string | number; domain?: string;
};

function parseGdeltDate(s: string): Date | null {
  // Format: "20231015T120000Z" or "20231015120000"
  try {
    const cleaned = s.replace("T", "").replace("Z", "");
    const y = cleaned.slice(0, 4), mo = cleaned.slice(4, 6), d = cleaned.slice(6, 8);
    const h = cleaned.slice(8, 10), mi = cleaned.slice(10, 12);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`);
  } catch { return null; }
}

async function fetchGdelt(query: string, startDate: Date, endDate: Date, maxRecords = 100): Promise<GdeltArticle[]> {
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,"0")}${String(d.getUTCDate()).padStart(2,"0")}000000`;

  const url = `${GDELT_BASE}?query=${encodeURIComponent(query)}&mode=artlist&format=json&maxrecords=${maxRecords}&sort=DateDesc&startdatetime=${fmt(startDate)}&enddatetime=${fmt(endDate)}`;

  const res = await fetch(url, { cache: "no-store" });
  await new Promise((r) => setTimeout(r, 200)); // be polite
  if (!res.ok) return [];
  const json = await res.json() as { articles?: GdeltArticle[] };
  return json.articles ?? [];
}

export type EventIngestResult = { query: string; fetched: number; saved: number; error?: string };

export async function ingestGdeltEvents(
  startDate: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // default: last 90 days
  endDate: Date = new Date()
): Promise<EventIngestResult[]> {
  const results: EventIngestResult[] = [];

  for (const { q, tags } of QUERY_GROUPS) {
    let fetched = 0, saved = 0;
    try {
      const articles = await fetchGdelt(q, startDate, endDate, 100);
      fetched = articles.length;

      for (const art of articles) {
        if (!art.url || !art.title) continue;

        // Dedup by URL
        const exists = await db.globalEvent.findFirst({ where: { url: art.url }, select: { id: true } });
        if (exists) continue;

        const eventDate = art.seendate ? parseGdeltDate(art.seendate) : null;
        if (!eventDate) continue;

        const sourceCountry = art.sourcecountry ? (COUNTRY_MAP[art.sourcecountry] ?? art.sourcecountry) : null;
        const titleCountries = countriesFromTitle(art.title);
        const allCountries = [...new Set([...(sourceCountry ? [sourceCountry] : []), ...titleCountries])];
        const tone = art.tone !== undefined && art.tone !== null ? parseFloat(String(art.tone)) : null;

        await db.globalEvent.create({
          data: {
            source: "gdelt",
            eventDate,
            title: art.title.slice(0, 500),
            url: art.url,
            tone: isNaN(tone as number) ? null : tone,
            countries: allCountries,
            industries: ["bicycle"],
            tags,
          },
        });
        saved++;
      }
      results.push({ query: q.slice(0, 40), fetched, saved });
    } catch (err) {
      results.push({ query: q.slice(0, 40), fetched, saved, error: String(err) });
    }
  }

  return results;
}

// Re-tag existing events that only had a sourcecountry — add keyword-based countries from title
export async function retagEventCountries(): Promise<{ updated: number }> {
  const events = await db.globalEvent.findMany({
    select: { id: true, title: true, countries: true },
  });
  let updated = 0;
  for (const ev of events) {
    const titleCountries = countriesFromTitle(ev.title);
    const merged = [...new Set([...ev.countries, ...titleCountries])];
    if (merged.length !== ev.countries.length || merged.some((c) => !ev.countries.includes(c))) {
      await db.globalEvent.update({ where: { id: ev.id }, data: { countries: merged } });
      updated++;
    }
  }
  return { updated };
}
