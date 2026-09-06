import { checkAdminAuth } from "@/lib/admin";
import { writeClient } from "@/sanity/lib/write-client";

type LocaleContent = { title: string; summary: string; keyPoints: string[] };
type Article = { en: LocaleContent; zh: LocaleContent; ja: LocaleContent; de: LocaleContent };

let _keyCounter = 0;
function k() { return `k${(++_keyCounter).toString(36)}`; }

type PTBlock = { _type: string; _key: string; style?: string; listItem?: string; level?: number; children: unknown[]; markDefs: unknown[] };

function buildBody(summary: string, keyPoints: string[], sourceUrl: string, sourceName: string): PTBlock[] {
  const blocks: PTBlock[] = [
    {
      _type: "block",
      _key: k(),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: k(), text: summary, marks: [] }],
    },
  ];

  for (const point of keyPoints.slice(0, 3)) {
    blocks.push({
      _type: "block",
      _key: k(),
      style: "normal",
      listItem: "bullet",
      level: 1,
      markDefs: [],
      children: [{ _type: "span", _key: k(), text: point, marks: [] }],
    });
  }

  if (sourceUrl) {
    const linkKey = k();
    blocks.push({
      _type: "block",
      _key: k(),
      style: "normal",
      markDefs: [{ _type: "link", _key: linkKey, href: sourceUrl, blank: true }],
      children: [{ _type: "span", _key: k(), text: `Source: ${sourceName || sourceUrl}`, marks: [linkKey] }],
    });
  }

  return blocks;
}

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
  const { article, sourceItemIds, primaryUrl, sourceName, audience } = body as {
    article?: Article;
    sourceItemIds?: string[];
    primaryUrl?: string;
    sourceName?: string;
    audience?: string;
  };

  if (!article?.en?.title) {
    return Response.json({ error: "article required" }, { status: 400 });
  }

  const slug = slugify(article.en.title);

  const postDoc = {
    _type: "post",
    status: "draft",
    postType: "industry",
    audience: audience ?? "both",
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
      en: article.en.summary,
      zh: article.zh.summary,
      ja: article.ja.summary,
      de: article.de.summary,
    },
    body: {
      _type: "localizedBlockContent",
      en: buildBody(article.en.summary, article.en.keyPoints, primaryUrl ?? "", sourceName ?? "Source"),
      zh: buildBody(article.zh.summary, article.zh.keyPoints, primaryUrl ?? "", sourceName ?? "來源"),
      ja: buildBody(article.ja.summary, article.ja.keyPoints, primaryUrl ?? "", sourceName ?? "ソース"),
      de: buildBody(article.de.summary, article.de.keyPoints, primaryUrl ?? "", sourceName ?? "Quelle"),
    },
    sourceUrl: primaryUrl,
  };

  const created = await writeClient.create(postDoc);

  if (sourceItemIds?.length) {
    await Promise.all(
      sourceItemIds.map((id) =>
        writeClient.patch(id).set({
          generatedPost: { _type: "reference", _ref: created._id },
          status: "collected",
        }).commit()
      )
    );
  }

  return Response.json({ ok: true, postId: created._id, slug });
}
