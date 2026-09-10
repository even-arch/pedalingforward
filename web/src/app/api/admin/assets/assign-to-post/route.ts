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

function pickBest(candidates: LibraryImage[], mediaTags: string[]): LibraryImage | null {
  const querySet = new Set(mediaTags);
  const ranked = candidates
    .filter((c) => c.image?.asset?._ref)
    .map((c) => ({ ...c, overlap: (c.tags ?? []).filter((t) => querySet.has(t)).length }))
    .sort((a, b) => b.overlap - a.overlap);
  return ranked[0] ?? null;
}

async function assignFromLibraryImage(postId: string, img: LibraryImage) {
  await writeClient.patch(postId).set({
    mainImage: {
      _type: "image",
      asset: { _type: "reference", _ref: img.image!.asset!._ref },
    },
  }).commit();
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, force } = await req.json() as { postId: string; force?: boolean };
  if (!postId) return Response.json({ error: "postId required" }, { status: 400 });

  const post = await writeClient.fetch<{
    mediaTags?: string[];
    mainImage?: { asset?: { _ref: string } } | null;
  }>(
    `*[_type == "post" && _id == $id][0]{ mediaTags, mainImage }`,
    { id: postId },
    { cache: "no-store" }
  );

  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

  if (!force && post.mainImage?.asset?._ref) {
    return Response.json({ ok: true, source: "already-set" });
  }

  const mediaTags = post.mediaTags ?? [];
  if (!mediaTags.length) {
    return Response.json({ ok: true, source: "no-tags" });
  }

  // Find asset refs already used by OTHER published posts
  const usedRefs = new Set(
    await writeClient.fetch<string[]>(
      `*[_type == "post" && defined(publishedAt) && defined(mainImage.asset) && _id != $id].mainImage.asset._ref`,
      { id: postId },
      { cache: "no-store" }
    )
  );

  // Query imageAsset library for tag-matching candidates
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

  // Prefer images not already used by another post
  const unused = candidates.filter((c) => !usedRefs.has(c.image?.asset?._ref ?? ""));

  if (unused.length > 0) {
    const best = pickBest(unused, mediaTags)!;
    await assignFromLibraryImage(postId, best);
    return Response.json({ ok: true, source: "library", imageId: best._id });
  }

  // All library matches already in use — fetch fresh from Pixabay and add to library
  const pixabayKey = await getPixabayKey();
  if (pixabayKey) {
    const attached = await fetchAndAttachImage(postId, mediaTags, pixabayKey);
    if (attached) return Response.json({ ok: true, source: "pixabay-new" });
  }

  // Last resort: reuse a library image even if duplicated (better than no image)
  if (candidates.length > 0) {
    const best = pickBest(candidates, mediaTags)!;
    await assignFromLibraryImage(postId, best);
    return Response.json({ ok: true, source: "library-reuse" });
  }

  return Response.json({ ok: false, source: "no-image-found" });
}
