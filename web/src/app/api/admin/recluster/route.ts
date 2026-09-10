import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

const GEO_TAGS = new Set([
  "taiwan", "japan", "china", "germany", "netherlands", "uk", "us",
  "france", "italy", "belgium", "denmark", "sweden",
]);

function signalTags(tags: string[]): string[] {
  return tags.filter((t) => !GEO_TAGS.has(t));
}

function signalOverlap(a: string[], b: string[]): number {
  const sa = new Set(signalTags(a));
  return signalTags(b).filter((t) => sa.has(t)).length;
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await writeClient.fetch<{ _id: string; tags?: string[]; publishedAt?: string; _createdAt: string }[]>(
    `*[_type == "mediaItem" && status == "analyzed" && !defined(clusterGroup)]{_id, tags, publishedAt, _createdAt}`,
    {},
    { cache: "no-store" }
  );

  if (!items.length) {
    return Response.json({ ok: true, message: "所有已分析文章都已打包", clustered: 0, groups: 0 });
  }

  const sorted = [...items].sort((a, b) => {
    const da = new Date(a.publishedAt ?? a._createdAt).getTime();
    const db = new Date(b.publishedAt ?? b._createdAt).getTime();
    return da - db;
  });

  type Cluster = { groupId: string; tags: string[]; minMs: number; maxMs: number; ids: string[] };
  const clusters: Cluster[] = [];

  for (const item of sorted) {
    const ms = new Date(item.publishedAt ?? item._createdAt).getTime();
    const tags = item.tags ?? [];
    let matched = false;

    for (const c of clusters) {
      const daysDiff = Math.max(Math.abs(ms - c.minMs), Math.abs(ms - c.maxMs)) / 86_400_000;
      if (daysDiff <= 7 && signalOverlap(tags, c.tags) >= 2) {
        c.ids.push(item._id);
        c.tags = [...new Set([...c.tags, ...tags])];
        if (ms < c.minMs) c.minMs = ms;
        if (ms > c.maxMs) c.maxMs = ms;
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({ groupId: crypto.randomUUID(), tags, minMs: ms, maxMs: ms, ids: [item._id] });
    }
  }

  await Promise.all(
    clusters.flatMap(({ groupId, ids }) =>
      ids.map((id) => writeClient.patch(id).set({ clusterGroup: groupId }).commit())
    )
  );

  const multiGroups = clusters.filter((c) => c.ids.length > 1).length;

  return Response.json({
    ok: true,
    clustered: items.length,
    groups: clusters.length,
    multiGroups,
    message: `${items.length} 篇分成 ${clusters.length} 組（其中 ${multiGroups} 組為多篇合包）`,
  });
}
