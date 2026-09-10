import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

type ImageAsset = {
  _id: string;
  title: string;
  quality?: string;
  tags?: string[];
  usageRights?: string;
  imageUrl?: string;
  overlap?: number;
};

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tags } = await req.json() as { tags: string[] };
  if (!Array.isArray(tags) || !tags.length) {
    return Response.json({ error: "tags must be a non-empty array" }, { status: 400 });
  }

  // Fetch all imageAssets that share at least one tag with the query
  const tagList = tags.map((t) => `"${t}"`).join(", ");
  const items = await writeClient.fetch<ImageAsset[]>(
    `*[_type == "imageAsset" && count((tags[])[@ in [${tagList}]]) > 0] {
      _id, title, quality, tags, usageRights,
      "imageUrl": image.asset->url
    }`,
    {},
    { cache: "no-store" }
  );

  // Sort by overlap count descending
  const querySet = new Set(tags);
  const scored = items.map((item) => ({
    ...item,
    overlap: (item.tags ?? []).filter((t) => querySet.has(t)).length,
  }));
  scored.sort((a, b) => b.overlap - a.overlap);

  return Response.json({ items: scored });
}
