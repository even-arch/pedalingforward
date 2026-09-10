import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

// GET — list published posts that have no mainImage yet
export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await writeClient.fetch<{ _id: string; title?: string; slug?: string }[]>(
    `*[_type == "post" && defined(publishedAt) && !defined(mainImage.asset)] {
      _id,
      "title": coalesce(title.en, title.zh, "untitled"),
      "slug": slug.current
    } | order(publishedAt desc)`,
    {},
    { cache: "no-store" }
  );

  return Response.json({ posts, count: posts.length });
}
