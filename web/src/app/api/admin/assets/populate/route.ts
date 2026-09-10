import { checkAdminAuth, getPixabayKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 60;

// Tag vocabulary to pre-populate — same taxonomy used by the AI tagger and posts
const POPULATE_TAGS: { tag: string; query: string }[] = [
  // Topics
  { tag: "supply-chain",   query: "bicycle factory manufacturing" },
  { tag: "product-launch", query: "new bicycle component" },
  { tag: "market-news",    query: "cycling industry business" },
  { tag: "trade-show",     query: "bicycle trade show exhibition" },
  { tag: "retail",         query: "bicycle shop store" },
  { tag: "regulation",     query: "bicycle transportation policy" },
  { tag: "tech",           query: "bicycle technology innovation" },
  { tag: "e-bike",         query: "electric bicycle ebike" },
  { tag: "urban",          query: "city cycling commute" },
  { tag: "cargo-bike",     query: "cargo bicycle utility" },
  { tag: "gravel",         query: "gravel cycling adventure" },
  { tag: "mtb",            query: "mountain bike trail" },
  { tag: "road",           query: "road cycling race" },
  // Brands
  { tag: "shimano",        query: "shimano bicycle component" },
  { tag: "sram",           query: "sram bicycle drivetrain" },
  { tag: "bosch",          query: "bosch electric bike motor" },
  { tag: "trek",           query: "trek bicycle" },
  { tag: "giant",          query: "giant bicycle" },
  { tag: "specialized",    query: "specialized bicycle" },
  { tag: "merida",         query: "merida bicycle" },
  // Tech terms
  { tag: "carbon-fiber",      query: "carbon fiber bicycle frame" },
  { tag: "hydraulic-brakes",  query: "bicycle disc brake" },
  { tag: "suspension",        query: "bike suspension fork" },
  { tag: "derailleur",        query: "bicycle derailleur gear" },
  { tag: "frame",             query: "bicycle frame" },
];

const IMAGES_PER_TAG = 3;

type PixabayHit = {
  id: number;
  largeImageURL: string;
  webformatURL: string;
  tags: string;
  user: string;
};

async function searchPixabay(query: string, key: string): Promise<PixabayHit[]> {
  const url =
    `https://pixabay.com/api/?key=${key}` +
    `&q=${encodeURIComponent(query)}` +
    `&image_type=photo&orientation=horizontal&min_width=1000` +
    `&per_page=${IMAGES_PER_TAG}&safesearch=true&order=popular`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json() as { hits?: PixabayHit[] };
  return data.hits ?? [];
}

async function downloadAndStore(hit: PixabayHit, tag: string): Promise<boolean> {
  try {
    const imgRes = await fetch(hit.largeImageURL || hit.webformatURL);
    if (!imgRes.ok) return false;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const asset = await writeClient.assets.upload("image", buffer, {
      filename: `pixabay-${hit.id}.jpg`,
      contentType: "image/jpeg",
    });
    await writeClient.create({
      _type: "imageAsset",
      title: `${tag} — Pixabay #${hit.id}`,
      image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      quality: "lifestyle",
      tags: [tag],
      source: `Pixabay #${hit.id} (${hit.user})`,
      usageRights: "stock",
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pixabayKey = await getPixabayKey();
  if (!pixabayKey) {
    return Response.json({ error: "Pixabay API key not configured" }, { status: 500 });
  }

  const results: { tag: string; added: number; skipped: boolean; error?: string }[] = [];

  for (const { tag, query: searchQuery } of POPULATE_TAGS) {
    try {
      // Check how many images already exist for this tag
      const existingIds = await writeClient.fetch<string[]>(
        `*[_type == "imageAsset" && $tagVal in tags]._id`,
        { tagVal: tag }
      );
      const existing = existingIds.length;

      if (existing >= IMAGES_PER_TAG) {
        results.push({ tag, added: 0, skipped: true });
        continue;
      }

      const hits = await searchPixabay(searchQuery, pixabayKey);
      const needed = IMAGES_PER_TAG - existing;
      let added = 0;

      for (const hit of hits.slice(0, needed)) {
        if (await downloadAndStore(hit, tag)) added++;
      }

      results.push({ tag, added, skipped: false });

      // Brief pause to avoid Pixabay rate limit (100 req/min free tier)
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      results.push({ tag, added: 0, skipped: false, error: String(err) });
    }
  }

  const totalAdded = results.reduce((s, r) => s + r.added, 0);
  const totalSkipped = results.filter((r) => r.skipped).length;

  return Response.json({
    ok: true,
    totalAdded,
    totalSkipped,
    totalTags: POPULATE_TAGS.length,
    results,
  });
}
