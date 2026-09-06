import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

export async function GET(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "analyzed";

  if (status === "counts") {
    const counts = await writeClient.fetch<{ raw: number; analyzed: number; collected: number; dismissed: number }>(
      `{
        "raw": count(*[_type == "mediaItem" && status == "raw"]),
        "analyzed": count(*[_type == "mediaItem" && status == "analyzed"]),
        "collected": count(*[_type == "mediaItem" && status == "collected"]),
        "dismissed": count(*[_type == "mediaItem" && status == "dismissed"])
      }`,
      {},
      { cache: "no-store" }
    );
    return Response.json({ counts });
  }

  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 200);

  const items = await writeClient.fetch(
    `*[_type == "mediaItem" && status == $status] | order(relevanceScore desc, publishedAt desc)[0...$limit]{
      _id, title, url, sourceName, sourceLanguage, sourceRegion, description,
      summary, keyPoints, tags, fullTextFetched,
      publishedAt, fetchedAt, status, relevanceScore, relevanceReason,
      "hasPost": defined(generatedPost)
    }`,
    { status, limit },
    { cache: "no-store" }
  );

  return Response.json({ items });
}

export async function PATCH(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };

  if (!id || !status) {
    return Response.json({ error: "id and status required" }, { status: 400 });
  }

  const valid = ["raw", "analyzed", "collected", "dismissed"];
  if (!valid.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  await writeClient.patch(id).set({ status }).commit();
  return Response.json({ ok: true });
}
