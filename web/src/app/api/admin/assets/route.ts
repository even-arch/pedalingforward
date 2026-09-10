import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";
import { addToBlocklist } from "@/lib/pixabay-blocklist";

type ImageAsset = {
  _id: string;
  _createdAt: string;
  title: string;
  quality?: string;
  tags?: string[];
  modelNo?: string;
  source?: string;
  usageRights?: string;
  image?: { asset?: { _ref: string }; hotspot?: unknown; crop?: unknown };
  imageUrl?: string;
};

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const quality = searchParams.get("quality");

  let filter = `_type == "imageAsset"`;
  if (tag) filter += ` && "${tag}" in tags`;
  if (quality) filter += ` && quality == "${quality}"`;

  const items = await writeClient.fetch<ImageAsset[]>(
    `*[${filter}] | order(_createdAt desc) {
      _id, _createdAt, title, quality, tags, modelNo, source, usageRights,
      image { asset, hotspot, crop },
      "imageUrl": image.asset->url
    }`,
    {},
    { cache: "no-store" }
  );

  return Response.json({ items });
}

export async function PATCH(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...fields } = await req.json() as { id: string; [key: string]: unknown };
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const allowed = ["title", "quality", "tags", "modelNo", "source", "usageRights"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) patch[key] = fields[key];
  }

  await writeClient.patch(id).set(patch).commit();
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json() as { id: string };
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  // If this was a Pixabay image, add its ID to the blocklist before deleting
  const doc = await writeClient.fetch<{ pixabayId?: string }>(
    `*[_id == $id][0]{ pixabayId }`,
    { id },
    { cache: "no-store" }
  );
  if (doc?.pixabayId) {
    await addToBlocklist(doc.pixabayId);
  }

  await writeClient.delete(id);
  return Response.json({ ok: true });
}
