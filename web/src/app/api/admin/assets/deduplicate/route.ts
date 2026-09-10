import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 60;

type RawAsset = {
  _id: string;
  _createdAt: string;
  pixabayId?: string;
  source?: string;
};

const PIXABAY_RE = /Pixabay #(\d+)/;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await writeClient.fetch<RawAsset[]>(
    `*[_type == "imageAsset"]{ _id, _createdAt, pixabayId, source }`,
    {},
    { cache: "no-store" }
  );

  // Step 1: backfill pixabayId from source — sequential to avoid rate limits
  let backfilled = 0;
  for (const a of all) {
    if (a.pixabayId || !a.source) continue;
    const m = a.source.match(PIXABAY_RE);
    if (!m) continue;
    try {
      await writeClient.patch(a._id).set({ pixabayId: m[1] }).commit();
      a.pixabayId = m[1];
      backfilled++;
    } catch {
      // skip on error, continue with others
    }
  }

  // Step 2: group by pixabayId, keep oldest, delete extras — sequential
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
    group.sort((a, b) => a._createdAt.localeCompare(b._createdAt));
    for (const dup of group.slice(1)) {
      try {
        await writeClient.delete(dup._id);
        deleted++;
      } catch {
        // skip on error
      }
    }
  }

  return Response.json({ ok: true, backfilled, deleted, total: all.length });
}
