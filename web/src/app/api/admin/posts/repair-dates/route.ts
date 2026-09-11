import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all published posts with their associated mediaItems' publishedAt dates
  const posts = await writeClient.fetch<{
    _id: string;
    publishedAt?: string;
    title?: { zh?: string; en?: string };
    "sourceItems": { publishedAt?: string }[];
  }[]>(
    `*[_type == "post" && status in ["published", "draft"]]{
      _id, publishedAt, title,
      "sourceItems": *[_type == "mediaItem" && generatedPost._ref == ^._id]{ publishedAt }
    }`,
    {},
    { cache: "no-store" }
  );

  let repaired = 0;
  const details: string[] = [];

  for (const post of posts) {
    const dates = (post.sourceItems ?? [])
      .map((i) => i.publishedAt)
      .filter(Boolean) as string[];
    if (!dates.length) continue;

    const earliestDate = dates.sort()[0];

    // Only update if the date would actually change (more than 1 day difference)
    if (post.publishedAt) {
      const existing = new Date(post.publishedAt).getTime();
      const target = new Date(earliestDate).getTime();
      if (Math.abs(existing - target) < 86400000) continue; // within 1 day — skip
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
