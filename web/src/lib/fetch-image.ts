import { writeClient } from "@/sanity/lib/write-client";
import { getBlockedPixabayIds } from "@/lib/pixabay-blocklist";

// Tags that carry no topical signal — excluded from query building
const GEO_TAGS = new Set([
  "taiwan", "japan", "china", "germany", "netherlands", "uk", "us",
  "france", "italy", "belgium", "denmark", "sweden",
]);

// Every query includes "bicycle" — Shimano/SRAM/Bosch all have non-bike product lines
// (fishing tackle, automotive parts); without it, search results are off-topic.
const TAG_QUERIES: Record<string, string> = {
  // Brands
  "shimano":          "bicycle shimano component",
  "sram":             "bicycle sram drivetrain",
  "campagnolo":       "bicycle campagnolo road",
  "bosch":            "bicycle bosch ebike motor",
  "brose":            "bicycle brose motor",
  "mahle":            "bicycle ebike motor",
  "trek":             "bicycle trek",
  "giant":            "bicycle giant",
  "specialized":      "bicycle specialized",
  "cannondale":       "bicycle cannondale",
  "scott":            "bicycle scott",
  "cube":             "bicycle cube",
  "canyon":           "bicycle canyon",
  "merida":           "bicycle merida",
  // Topics
  "e-bike":           "bicycle electric ebike",
  "supply-chain":     "bicycle supply chain",
  "product-launch":   "bicycle new product component",
  "trade-show":       "bicycle trade show exhibition",
  "retail":           "bicycle shop retail",
  "market-news":      "bicycle industry market",
  "regulation":       "bicycle transport regulation",
  "tech":             "bicycle technology innovation",
  "urban":            "bicycle urban city commute",
  "cargo-bike":       "bicycle cargo utility",
  "gravel":           "bicycle gravel adventure",
  "mtb":              "bicycle mountain trail",
  "road":             "bicycle road racing",
  // Tech terms
  "carbon-fiber":     "bicycle carbon fiber frame",
  "hydraulic-brakes": "bicycle disc brake hydraulic",
  "dropper-post":     "bicycle dropper seatpost",
  "suspension":       "bicycle suspension fork",
  "derailleur":       "bicycle derailleur gear",
  "chainring":        "bicycle chainring crankset",
  "cassette":         "bicycle cassette sprocket",
  "hub":              "bicycle wheel hub",
  "rim":              "bicycle wheel rim",
  "tire":             "bicycle tire",
  "saddle":           "bicycle saddle",
  "handlebar":        "bicycle handlebar",
  "frame":            "bicycle frame",
};

function signalTags(tags: string[]): string[] {
  return tags.filter((t) => !GEO_TAGS.has(t));
}

function buildQuery(tags: string[]): string {
  const signals = signalTags(tags);

  // Brand tags take priority — they give the most specific results
  for (const tag of signals) {
    if (TAG_QUERIES[tag]) return TAG_QUERIES[tag];
  }

  // Fall back to first signal tag + bicycle
  if (signals.length) return `${signals[0]} bicycle`;

  return "bicycle cycling";
}

type PixabayHit = {
  id: number;
  largeImageURL: string;
  webformatURL: string;
  tags: string;
  user: string;
  pageURL: string;
  imageWidth: number;
  imageHeight: number;
};

type PixabayResponse = {
  total: number;
  hits: PixabayHit[];
};

export async function fetchAndAttachImage(
  postId: string,
  mediaTags: string[],
  pixabayKey: string,
): Promise<boolean> {
  try {
    const query = buildQuery(mediaTags);

    // Fetch blocklist + existing library IDs in parallel to filter duplicates
    const [blocked, existingIds] = await Promise.all([
      getBlockedPixabayIds(),
      writeClient.fetch<string[]>(
        `*[_type == "imageAsset" && defined(pixabayId)].pixabayId`,
        {},
        { cache: "no-store" }
      ),
    ]);
    const existingSet = new Set(existingIds);

    const apiUrl =
      `https://pixabay.com/api/?key=${pixabayKey}` +
      `&q=${encodeURIComponent(query)}` +
      `&image_type=photo` +
      `&orientation=horizontal` +
      `&min_width=1000` +
      `&per_page=15` +
      `&safesearch=true` +
      `&order=popular`;

    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) return false;

    const data = (await apiRes.json()) as PixabayResponse;

    // Find first hit that's not blocked and not already in the library
    const hit = data.hits?.find((h) => {
      const pid = String(h.id);
      return !blocked.has(pid) && !existingSet.has(pid);
    });
    if (!hit) return false;

    const imageUrl = hit.largeImageURL || hit.webformatURL;
    if (!imageUrl) return false;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return false;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const asset = await writeClient.assets.upload("image", buffer, {
      filename: `pixabay-${hit.id}.jpg`,
      contentType: "image/jpeg",
    });

    const signals = signalTags(mediaTags);

    await Promise.all([
      writeClient.patch(postId).set({
        mainImage: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          alt: { _type: "localizedString", en: hit.tags, zh: hit.tags, ja: hit.tags, de: hit.tags },
        },
      }).commit(),

      writeClient.create({
        _type: "imageAsset",
        title: `${query} — Pixabay #${hit.id}`,
        image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
        pixabayId: String(hit.id),
        quality: "lifestyle",
        tags: signals,
        source: `Pixabay #${hit.id} (${hit.user}) · query: "${query}"`,
        usageRights: "stock",
      }),
    ]);

    return true;
  } catch {
    return false;
  }
}
