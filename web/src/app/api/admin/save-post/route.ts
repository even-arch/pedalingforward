import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";
import { mdToPt } from "@/lib/md-to-pt";

type LocaleContent = { title: string; excerpt: string; body: string };
type Article = { en: LocaleContent; zh: LocaleContent; ja: LocaleContent; de: LocaleContent };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { article, sourceItemIds } = body as { article?: Article; sourceItemIds?: string[] };

  if (!article?.en?.title) {
    return Response.json({ error: "article required" }, { status: 400 });
  }

  const slug = slugify(article.en.title);

  const postDoc = {
    _type: "post",
    title: {
      _type: "localizedString",
      en: article.en.title,
      zh: article.zh.title,
      ja: article.ja.title,
      de: article.de.title,
    },
    slug: { _type: "slug", current: slug },
    publishedAt: new Date().toISOString(),
    excerpt: {
      _type: "localizedText",
      en: article.en.excerpt,
      zh: article.zh.excerpt,
      ja: article.ja.excerpt,
      de: article.de.excerpt,
    },
    body: {
      _type: "localizedBlockContent",
      en: mdToPt(article.en.body),
      zh: mdToPt(article.zh.body),
      ja: mdToPt(article.ja.body),
      de: mdToPt(article.de.body),
    },
  };

  const created = await writeClient.create(postDoc);

  // Mark source items as having a generated post
  if (sourceItemIds?.length) {
    await Promise.all(
      sourceItemIds.map((id) =>
        writeClient.patch(id).set({ generatedPost: { _type: "reference", _ref: created._id } }).commit()
      )
    );
  }

  return Response.json({ ok: true, postId: created._id, slug });
}
