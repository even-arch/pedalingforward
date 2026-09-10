import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";
import { writeClient } from "@/sanity/lib/write-client";
import { processGenerationJob } from "@/lib/media-generate";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { clusterGroup, itemId, audience, editorialNote } = body as {
    clusterGroup?: string;
    itemId?: string;
    audience?: string;
    editorialNote?: string;
  };

  if (!clusterGroup && !itemId) {
    return Response.json({ error: "clusterGroup or itemId required" }, { status: 400 });
  }

  let items: { _id: string }[];
  if (itemId) {
    // Singleton: fetch by _id directly
    const item = await writeClient.fetch<{ _id: string } | null>(
      `*[_type == "mediaItem" && _id == $id && status == "analyzed"][0]{_id}`,
      { id: itemId },
      { cache: "no-store" }
    );
    items = item ? [item] : [];
  } else {
    items = await writeClient.fetch<{ _id: string }[]>(
      `*[_type == "mediaItem" && clusterGroup == $cg && status == "analyzed"]{_id}`,
      { cg: clusterGroup },
      { cache: "no-store" }
    );
  }

  if (!items.length) {
    return Response.json({ error: "No analyzed items in this cluster" }, { status: 404 });
  }

  const job = await db.mediaGenerationJob.create({
    data: {
      itemIds: items.map((i) => i._id),
      autoSave: true,
      audience: audience ?? "both",
      editorialNote: editorialNote ?? null,
    },
  });

  waitUntil(
    processGenerationJob(job.id).catch((err) => {
      console.error("[collect-cluster] background job failed:", err);
    })
  );

  return Response.json({ ok: true, jobId: job.id });
}
