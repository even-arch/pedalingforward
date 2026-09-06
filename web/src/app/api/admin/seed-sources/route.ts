import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const DEFAULT_SOURCES = [
  // --- Trade publications ---
  {
    name: "Cycling Industry News",
    url: "https://cyclingindustry.news/feed/",
    language: "en", kind: "rss", audience: "shop", region: "UK",
  },
  {
    name: "Bike Europe",
    url: "https://www.bike-europe.com/rss",
    language: "en", kind: "rss", audience: "both", region: "EU",
  },
  {
    name: "Bicycle Retailer (BRAIN)",
    url: "https://www.bicycleretailer.com/rss.xml",
    language: "en", kind: "rss", audience: "shop", region: "US",
  },
  {
    name: "VeloNews",
    url: "https://www.velonews.com/feed/",
    language: "en", kind: "rss", audience: "shop", region: "US",
  },
  {
    name: "BikeRadar",
    url: "https://www.bikeradar.com/feed/",
    language: "en", kind: "rss", audience: "shop", region: "UK",
  },
  {
    name: "Pinkbike",
    url: "https://www.pinkbike.com/news/rss/",
    language: "en", kind: "rss", audience: "shop", region: "US",
  },
  {
    name: "road.cc",
    url: "https://road.cc/rss.xml",
    language: "en", kind: "rss", audience: "shop", region: "UK",
  },
  {
    name: "Cycling Weekly",
    url: "https://www.cyclingweekly.com/news/feed",
    language: "en", kind: "rss", audience: "shop", region: "UK",
  },
  // --- Google News: urban cycling by region ---
  {
    name: "Google News · Cycling Infrastructure (EU/EN)",
    url: "https://news.google.com/rss/search?q=cycling+infrastructure+bike+lane&hl=en&gl=US&ceid=US:en",
    language: "en", kind: "googlenews", audience: "both", region: "GLOBAL",
  },
  {
    name: "Google News · Fahrrad Infrastruktur (DE)",
    url: "https://news.google.com/rss/search?q=Fahrrad+Radweg+Infrastruktur&hl=de&gl=DE&ceid=DE:de",
    language: "de", kind: "googlenews", audience: "shop", region: "DE",
  },
  {
    name: "Google News · Fietsinfrastructuur (NL)",
    url: "https://news.google.com/rss/search?q=fiets+infrastructuur+fietspad&hl=nl&gl=NL&ceid=NL:nl",
    language: "nl", kind: "googlenews", audience: "shop", region: "NL",
  },
  {
    name: "Google News · Cycling Policy (UK)",
    url: "https://news.google.com/rss/search?q=cycling+policy+bike+lane&hl=en-GB&gl=GB&ceid=GB:en",
    language: "en", kind: "googlenews", audience: "shop", region: "UK",
  },
  {
    name: "Google News · Bicycle Industry Taiwan",
    url: "https://news.google.com/rss/search?q=%E8%87%AA%E8%A1%8C%E8%BB%8A+%E7%94%A2%E6%A5%AD+%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant",
    language: "zh", kind: "googlenews", audience: "supplier", region: "TW",
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
