import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // collected 沒有草稿關聯的 → raw
  const collectedItems = await writeClient.fetch<{ _id: string }[]>(
    `*[_type == "mediaItem" && status == "collected" && !defined(generatedPost)]{_id}`,
    {},
    { cache: "no-store" }
  );

  // dismissed 全部 → raw
  const dismissedItems = await writeClient.fetch<{ _id: string }[]>(
    `*[_type == "mediaItem" && status == "dismissed"]{_id}`,
    {},
    { cache: "no-store" }
  );

  const allIds = [
    ...collectedItems.map((i) => i._id),
    ...dismissedItems.map((i) => i._id),
  ];

  if (!allIds.length) {
    return Response.json({ ok: true, reset: 0, collected: 0, dismissed: 0 });
  }

  await Promise.all(
    allIds.map((id) =>
      writeClient.patch(id).set({ status: "raw", tags: [] }).commit()
    )
  );

  return Response.json({
    ok: true,
    reset: allIds.length,
    collected: collectedItems.length,
    dismissed: dismissedItems.length,
  });
}
