import { checkAdminAuth } from "@/lib/admin";
import { saveDraftPost, type GeneratedArticle } from "@/lib/save-media-post";

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { article, sourceItemIds, primaryUrl, audience } = body as {
    article?: GeneratedArticle;
    sourceItemIds?: string[];
    primaryUrl?: string;
    audience?: string;
  };

  if (!article?.en?.title) {
    return Response.json({ error: "article required" }, { status: 400 });
  }

  const { postId, slug } = await saveDraftPost(
    article,
    sourceItemIds ?? [],
    audience ?? "both",
    primaryUrl
  );

  return Response.json({ ok: true, postId, slug });
}
