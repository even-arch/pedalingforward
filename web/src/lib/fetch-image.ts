import { writeClient } from "@/sanity/lib/write-client";

// Tags that carry no topical signal — excluded from query building
const GEO_TAGS = new Set([
  "taiwan", "japan", "china", "germany", "netherlands", "uk", "us",
  "france", "italy", "belgium", "denmark", "sweden",
]);

// Maps signal tags to bicycle-specific Pixabay search terms.
// "bicycle" is always appended to brand tags to avoid non-bike results
// (Shimano and SRAM both make fishing tackle / automotive parts).
const TAG_QUERIES: Record<string, string> = {
  // Brands
  "shimano":          "shimano bicycle component",
  "sram":             "sram bicycle drivetrain",
  "campagnolo":       "campagnolo road cycling",
  "bosch":            "bosch electric bike",
  "brose":            "electric bike motor",
  "mahle":            "ebike motor system",
  "trek":             "trek bicycle",
  "giant":            "giant bicycle",
  "specialized":      "specialized bicycle",
  "cannondale":       "cannondale bicycle",
  "scott":            "scott bicycle",
  "cube":             "cube bicycle",
  "canyon":           "canyon bicycle",
  "merida":           "merida bicycle",
  // Topics
  "e-bike":           "electric bicycle",
  "supply-chain":     "bicycle factory manufacturing",
  "product-launch":   "new bicycle component",
  "trade-show":       "bicycle exhibition cycling",
  "retail":           "bicycle shop store",
  "market-news":      "cycling industry",
  "regulation":       "bicycle transportation",
  "tech":             "bicycle technology component",
  "urban":            "city cycling commute",
  "cargo-bike":       "cargo bicycle",
  "gravel":           "gravel cycling adventure",
  "mtb":              "mountain bike trail",
  "road":             "road cycling race",
  // Tech terms
  "carbon-fiber":     "carbon fiber bicycle frame",
  "hydraulic-brakes": "bicycle disc brake",
  "dropper-post":     "mountain bike seatpost",
  "suspension":       "bike suspension fork",
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

    const apiUrl =
      `https://pixabay.com/api/?key=${pixabayKey}` +
      `&q=${encodeURIComponent(query)}` +
      `&image_type=photo` +
      `&orientation=horizontal` +
      `&min_width=1000` +
      `&per_page=5` +
      `&safesearch=true` +
      `&order=popular`;

    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) return false;

    const data = (await apiRes.json()) as PixabayResponse;
    const hit = data.hits?.[0];
    if (!hit) return false;

    // Prefer largeImageURL; fall back to webformatURL
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

    // Attach as post mainImage and save to imageAsset library in parallel
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
        quality: "lifestyle",
        tags: signals,
        source: `Pixabay #${hit.id} (${hit.user}) · query: "${query}"`,
        usageRights: "stock",
      }),
    ]);

    return true;
  } catch {
    // Image fetch is best-effort — don't fail the article save
    return false;
  }
}
