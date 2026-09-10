import { checkAdminAuth, getPixabayKey } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";
import { fetchAndAttachImage } from "@/lib/fetch-image";

export const maxDuration = 30;

type LibraryImage = {
  _id: string;
  tags?: string[];
  image?: { asset?: { _ref: string } };
  imageUrl?: string;
};

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await req.json() as { postId: string };
  if (!postId) return Response.json({ error: "postId required" }, { status: 400 });

  // Fetch post's mediaTags and check if mainImage is already set
  const post = await writeClient.fetch<{
    mediaTags?: string[];
    mainImage?: { asset?: { _ref: string } } | null;
  }>(
    `*[_type == "post" && _id == $id][0]{ mediaTags, mainImage }`,
    { id: postId },
    { cache: "no-store" }
  );

  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

  // Skip if mainImage is already set — preserve manual curation
  if (post.mainImage?.asset?._ref) {
    return Response.json({ ok: true, source: "already-set" });
  }

  const mediaTags = post.mediaTags ?? [];
  if (!mediaTags.length) {
    return Response.json({ ok: true, source: "no-tags" });
  }

  // Query imageAsset library for best tag overlap
  const tagList = mediaTags.map((t) => `"${t}"`).join(", ");
  const candidates = await writeClient.fetch<LibraryImage[]>(
    `*[_type == "imageAsset" && count((tags[])[@ in [${tagList}]]) > 0] {
      _id, tags,
      image { asset },
      "imageUrl": image.asset->url
    }`,
    {},
    { cache: "no-store" }
  );

  if (candidates.length > 0) {
    // Pick image with most tag overlap
    const querySet = new Set(mediaTags);
    const best = candidates
      .map((c) => ({ ...c, overlap: (c.tags ?? []).filter((t) => querySet.has(t)).length }))
      .sort((a, b) => b.overlap - a.overlap)[0];

    if (best.image?.asset?._ref) {
      await writeClient.patch(postId).set({
        mainImage: {
          _type: "image",
          asset: { _type: "reference", _ref: best.image.asset._ref },
        },
      }).commit();
      return Response.json({ ok: true, source: "library", imageId: best._id });
    }
  }

  // Library miss — fetch from Pixabay, save to library, attach
  const pixabayKey = await getPixabayKey();
  if (!pixabayKey) {
    return Response.json({ ok: false, source: "no-pixabay-key" });
  }

  const attached = await fetchAndAttachImage(postId, mediaTags, pixabayKey);
  return Response.json({ ok: attached, source: "pixabay" });
}
