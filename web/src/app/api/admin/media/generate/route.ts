import { waitUntil } from "@vercel/functions";
import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";
import { processGenerationJob } from "@/lib/media-generate";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { itemIds, editorialNote } = body as { itemIds?: string[]; editorialNote?: string };

  if (!itemIds?.length) {
    return Response.json({ error: "itemIds required" }, { status: 400 });
  }

  const job = await db.mediaGenerationJob.create({
    data: { itemIds, editorialNote: editorialNote || null },
  });

  waitUntil(
    processGenerationJob(job.id).catch((err) => {
      console.error("[media/generate] background job failed:", err);
    })
  );

  return Response.json({ ok: true, jobId: job.id });
}
