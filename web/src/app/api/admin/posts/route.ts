import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";
import { mdToPt } from "@/lib/md-to-pt";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "draft";

  const posts = await writeClient.fetch(
    `*[_type == "post" && status == $status] | order(_createdAt desc)[0...50]{
      _id, _createdAt, status, postType, audience, editorialNote,
      title, slug, publishedAt, sourceUrl, mediaTags,
      excerpt,
      "mediaItems": *[_type == "mediaItem" && references(^._id)]{_id, title, url, sourceName}
    }`,
    { status },
    { cache: "no-store" }
  );

  return Response.json({ posts });
}

type PatchBody = {
  id?: string;
  action?: "publish" | "unpublish" | "update";
  editorialNote?: string;
  audience?: string;
  title?: { en?: string; zh?: string; ja?: string; de?: string };
  excerpt?: { en?: string; zh?: string; ja?: string; de?: string };
  keyPoints?: { en?: string[]; zh?: string[]; ja?: string[]; de?: string[] };
  sourceUrl?: string;
};

function buildBody(keyPoints: string[]) {
  let keyCounter = 0;
  const k = () => `k${(++keyCounter).toString(36)}`;

  type PTBlock = { _type: string; _key: string; style?: string; listItem?: string; level?: number; children: unknown[]; markDefs: unknown[] };
  return keyPoints.slice(0, 3).map((pt) => ({
    _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, markDefs: [],
    children: [{ _type: "span", _key: k(), text: pt, marks: [] }],
  } as PTBlock));
}

export async function PATCH(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as PatchBody;
  const { id, action } = body;

  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};

  if (action === "publish") {
    patch.status = "published";
    // publishedAt preserves the original source article date; only set if missing
  } else if (action === "unpublish") {
    patch.status = "draft";
  }

  if (body.editorialNote !== undefined) patch.editorialNote = body.editorialNote;
  if (body.audience !== undefined) patch.audience = body.audience;
  if (body.sourceUrl !== undefined) patch.sourceUrl = body.sourceUrl;

  if (body.title) {
    if (body.title.en !== undefined) patch["title.en"] = body.title.en;
    if (body.title.zh !== undefined) patch["title.zh"] = body.title.zh;
    if (body.title.ja !== undefined) patch["title.ja"] = body.title.ja;
    if (body.title.de !== undefined) patch["title.de"] = body.title.de;
  }

  if (body.excerpt) {
    if (body.excerpt.en !== undefined) patch["excerpt.en"] = body.excerpt.en;
    if (body.excerpt.zh !== undefined) patch["excerpt.zh"] = body.excerpt.zh;
    if (body.excerpt.ja !== undefined) patch["excerpt.ja"] = body.excerpt.ja;
    if (body.excerpt.de !== undefined) patch["excerpt.de"] = body.excerpt.de;
  }

  // Rebuild body only when keyPoints are explicitly provided (not on routine compose saves)
  if (body.keyPoints) {
    for (const locale of ["en", "zh", "ja", "de"] as const) {
      const points = body.keyPoints[locale] ?? [];
      if (points.length) {
        patch[`body.${locale}`] = buildBody(points);
      }
    }
  }

  if (!Object.keys(patch).length) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  await writeClient
    .patch(id)
    .set(patch)
    .setIfMissing({ publishedAt: new Date().toISOString() })
    .commit();
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  // Delete both the draft (drafts.<id>) and published version
  await writeClient.delete(`drafts.${id}`).catch(() => {});
  await writeClient.delete(id).catch(() => {});
  return Response.json({ ok: true, deleted: id });
}
