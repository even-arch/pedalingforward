import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 60;

type RawAsset = {
  _id: string;
  _createdAt: string;
  pixabayId?: string;
  source?: string;
};

// POST — backfill pixabayId from source field, then delete duplicates
export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await writeClient.fetch<RawAsset[]>(
    `*[_type == "imageAsset"]{ _id, _createdAt, pixabayId, source }`,
    {},
    { cache: "no-store" }
  );

  // Step 1: backfill pixabayId from source string "Pixabay #12345 (user) · ..."
  let backfilled = 0;
  const PIXABAY_RE = /Pixabay #(\d+)/;

  await Promise.all(
    all
      .filter((a) => !a.pixabayId && a.source)
      .map(async (a) => {
        const m = a.source!.match(PIXABAY_RE);
        if (!m) return;
        await writeClient.patch(a._id).set({ pixabayId: m[1] }).commit();
        a.pixabayId = m[1]; // update in-memory so dedup step sees it
        backfilled++;
      })
  );

  // Step 2: group by pixabayId, keep the oldest, delete the rest
  const byPixabayId = new Map<string, RawAsset[]>();
  for (const a of all) {
    if (!a.pixabayId) continue;
    const group = byPixabayId.get(a.pixabayId) ?? [];
    group.push(a);
    byPixabayId.set(a.pixabayId, group);
  }

  let deleted = 0;
  for (const [, group] of byPixabayId) {
    if (group.length <= 1) continue;
    // Keep oldest (first created), delete the rest
    group.sort((a, b) => a._createdAt.localeCompare(b._createdAt));
    const toDelete = group.slice(1);
    await Promise.all(toDelete.map((a) => writeClient.delete(a._id)));
    deleted += toDelete.length;
  }

  return Response.json({ ok: true, backfilled, deleted, total: all.length });
}
