import { checkAdminAuth } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const jobs = await db.mediaGenerationJob.findMany({
    where: { createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, itemIds: true, editorialNote: true, status: true,
      result: true, error: true, primaryUrl: true, primarySource: true,
      createdAt: true, doneAt: true,
    },
  });

  return Response.json({ jobs });
}

export async function PATCH(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json().catch(() => ({})) as { id?: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await db.mediaGenerationJob.delete({ where: { id } }).catch(() => {});
  return Response.json({ ok: true });
}
