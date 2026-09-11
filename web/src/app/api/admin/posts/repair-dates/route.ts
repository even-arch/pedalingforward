import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all posts with their associated mediaItems' dates
  // Use references() — more reliable than generatedPost._ref == ^._id in GROQ
  // Fetch both publishedAt and _createdAt from mediaItems so we always have a fallback date
  const posts = await writeClient.fetch<{
    _id: string;
    publishedAt?: string;
    title?: { zh?: string; en?: string };
    sourceItems: { publishedAt?: string; _createdAt: string }[];
  }[]>(
    `*[_type == "post" && status in ["published", "draft"]]{
      _id, publishedAt, title,
      "sourceItems": *[_type == "mediaItem" && references(^._id)]{ publishedAt, _createdAt }
    }`,
    {},
    { cache: "no-store" }
  );

  let repaired = 0;
  const details: string[] = [];

  for (const post of posts) {
    // Use publishedAt if available, otherwise fall back to _createdAt (RSS ingest date)
    const dates = (post.sourceItems ?? [])
      .map((i) => i.publishedAt ?? i._createdAt)
      .filter(Boolean) as string[];
    if (!dates.length) continue;

    const earliestDate = dates.sort()[0];

    // Skip only if difference is less than 6 hours (same-day articles are accurate)
    if (post.publishedAt) {
      const existing = new Date(post.publishedAt).getTime();
      const target = new Date(earliestDate).getTime();
      if (Math.abs(existing - target) < 6 * 3600 * 1000) continue;
    }

    try {
      await writeClient.patch(post._id).set({ publishedAt: earliestDate }).commit();
      repaired++;
      details.push(post.title?.zh ?? post.title?.en ?? post._id);
    } catch {
      // skip on error
    }
  }

  return Response.json({ ok: true, repaired, total: posts.length, details });
}
