import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return Response.json({ error: "No image provided" }, { status: 400 });

  const metaRaw = formData.get("meta") as string | null;
  const meta = metaRaw ? (JSON.parse(metaRaw) as {
    title?: string;
    quality?: string;
    tags?: string[];
    source?: string;
    usageRights?: string;
    modelNo?: string;
  }) : {};

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadedAsset = await writeClient.assets.upload("image", buffer, {
    filename: file.name,
    contentType: file.type,
  });

  const doc = await writeClient.create({
    _type: "imageAsset",
    title: meta.title || file.name.replace(/\.[^.]+$/, ""),
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: uploadedAsset._id },
    },
    quality: meta.quality || "raw",
    tags: meta.tags || [],
    source: meta.source || "",
    usageRights: meta.usageRights || "owned",
    modelNo: meta.modelNo || "",
  });

  return Response.json({
    ok: true,
    id: doc._id,
    assetId: uploadedAsset._id,
    imageUrl: uploadedAsset.url,
  });
}
