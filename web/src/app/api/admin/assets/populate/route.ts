import { checkAdminAuth, getPixabayKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 30;

export const POPULATE_TAGS: { tag: string; searchQuery: string }[] = [
  // Topics — "bicycle" always present to prevent off-topic results
  { tag: "supply-chain",      searchQuery: "bicycle supply chain" },
  { tag: "product-launch",    searchQuery: "bicycle new product component" },
  { tag: "market-news",       searchQuery: "bicycle industry market" },
  { tag: "trade-show",        searchQuery: "bicycle trade show exhibition" },
  { tag: "retail",            searchQuery: "bicycle shop retail" },
  { tag: "regulation",        searchQuery: "bicycle transport regulation" },
  { tag: "tech",              searchQuery: "bicycle technology innovation" },
  { tag: "e-bike",            searchQuery: "bicycle electric ebike" },
  { tag: "urban",             searchQuery: "bicycle urban city commute" },
  { tag: "cargo-bike",        searchQuery: "bicycle cargo utility" },
  { tag: "gravel",            searchQuery: "bicycle gravel adventure" },
  { tag: "mtb",               searchQuery: "bicycle mountain trail" },
  { tag: "road",              searchQuery: "bicycle road racing" },
  // Brands — "bicycle" prevents Shimano fishing gear, SRAM automotive, etc.
  { tag: "shimano",           searchQuery: "bicycle shimano component" },
  { tag: "sram",              searchQuery: "bicycle sram drivetrain" },
  { tag: "bosch",             searchQuery: "bicycle bosch ebike motor" },
  { tag: "trek",              searchQuery: "bicycle trek" },
  { tag: "giant",             searchQuery: "bicycle giant" },
  { tag: "specialized",       searchQuery: "bicycle specialized" },
  { tag: "merida",            searchQuery: "bicycle merida" },
  // Tech terms
  { tag: "carbon-fiber",      searchQuery: "bicycle carbon fiber frame" },
  { tag: "hydraulic-brakes",  searchQuery: "bicycle disc brake hydraulic" },
  { tag: "suspension",        searchQuery: "bicycle suspension fork" },
  { tag: "derailleur",        searchQuery: "bicycle derailleur gear" },
  { tag: "frame",             searchQuery: "bicycle frame" },
];

const IMAGES_PER_TAG = 3;

type PixabayHit = {
  id: number;
  largeImageURL: string;
  webformatURL: string;
  tags: string;
  user: string;
};

// GET — returns current library coverage per tag (no Pixabay calls)
export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await Promise.all(
    POPULATE_TAGS.map(async ({ tag }) => {
      const ids = await writeClient.fetch<string[]>(
        `*[_type == "imageAsset" && $tagVal in tags]._id`,
        { tagVal: tag }
      );
      return { tag, count: ids.length, needed: Math.max(0, IMAGES_PER_TAG - ids.length) };
    })
  );

  return Response.json({ tags: counts, imagesPerTag: IMAGES_PER_TAG });
}

// POST { tag, searchQuery } — fetches and stores images for ONE tag only
export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pixabayKey = await getPixabayKey();
  if (!pixabayKey) {
    return Response.json({ error: "Pixabay API key not configured — go to Admin → 系統設定 and set the Pixabay API Key" }, { status: 500 });
  }

  const { tag, searchQuery } = await req.json() as { tag: string; searchQuery: string };
  if (!tag || !searchQuery) {
    return Response.json({ error: "tag and searchQuery required" }, { status: 400 });
  }

  // Check existing coverage
  const existingIds = await writeClient.fetch<string[]>(
    `*[_type == "imageAsset" && $tagVal in tags]._id`,
    { tagVal: tag }
  );
  const existing = existingIds.length;

  if (existing >= IMAGES_PER_TAG) {
    return Response.json({ ok: true, tag, added: 0, skipped: true });
  }

  // Search Pixabay
  const needed = IMAGES_PER_TAG - existing;
  const apiUrl =
    `https://pixabay.com/api/?key=${pixabayKey}` +
    `&q=${encodeURIComponent(searchQuery)}` +
    `&image_type=photo&orientation=horizontal&min_width=1000` +
    `&per_page=${needed + 2}&safesearch=true&order=popular`;

  const pixRes = await fetch(apiUrl);
  if (!pixRes.ok) {
    return Response.json({ error: `Pixabay API error: ${pixRes.status}` }, { status: 502 });
  }
  const pixData = await pixRes.json() as { hits?: PixabayHit[] };
  const hits = pixData.hits ?? [];

  let added = 0;
  for (const hit of hits.slice(0, needed)) {
    try {
      const imgRes = await fetch(hit.largeImageURL || hit.webformatURL);
      if (!imgRes.ok) continue;
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
      added++;
    } catch {
      // skip this image, continue with next
    }
  }

  return Response.json({ ok: true, tag, added, skipped: false });
}
