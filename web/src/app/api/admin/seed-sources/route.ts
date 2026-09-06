import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const DEFAULT_SOURCES = [
  {
    name: "Cycling Industry News",
    url: "https://cyclingindustry.news/feed/",
    language: "en",
    kind: "rss",
    audience: "shop",
    region: "UK",
  },
  {
    name: "Bike Europe",
    url: "https://www.bike-europe.com/rss",
    language: "en",
    kind: "rss",
    audience: "both",
    region: "EU",
  },
  {
    name: "Bicycle Retailer (BRAIN)",
    url: "https://www.bicycleretailer.com/rss.xml",
    language: "en",
    kind: "rss",
    audience: "shop",
    region: "US",
  },
  {
    name: "VeloNews",
    url: "https://www.velonews.com/feed/",
    language: "en",
    kind: "rss",
    audience: "shop",
    region: "US",
  },
  {
    name: "BikeRadar",
    url: "https://www.bikeradar.com/feed/",
    language: "en",
    kind: "rss",
    audience: "shop",
    region: "UK",
  },
  {
    name: "Pinkbike",
    url: "https://www.pinkbike.com/news/rss/",
    language: "en",
    kind: "rss",
    audience: "shop",
    region: "US",
  },
  {
    name: "road.cc",
    url: "https://road.cc/rss.xml",
    language: "en",
    kind: "rss",
    audience: "shop",
    region: "UK",
  },
  {
    name: "Cycling Weekly",
    url: "https://www.cyclingweekly.com/news/feed",
    language: "en",
    kind: "rss",
    audience: "shop",
    region: "UK",
  },
];

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await writeClient.fetch<{ name: string }[]>(
    `*[_type == "mediaSource"]{name}`,
    {},
    { cache: "no-store" }
  );
  const existingNames = new Set(existing.map((s) => s.name));

  const toInsert = DEFAULT_SOURCES.filter((s) => !existingNames.has(s.name));

  if (!toInsert.length) {
    return Response.json({ ok: true, message: "全部來源已存在，無需重複新增", skipped: existing.length });
  }

  const results = await Promise.all(
    toInsert.map((s) =>
      writeClient.create({
        _type: "mediaSource",
        name: s.name,
        url: s.url,
        language: s.language,
        kind: s.kind,
        audience: s.audience,
        region: s.region,
        enabled: true,
      })
    )
  );

  return Response.json({ ok: true, inserted: results.length, skipped: existingNames.size });
}
