import { writeClient } from "@/sanity/lib/write-client";

export type LocaleContent = { title: string; summary: string; keyPoints: string[] };
export type GeneratedArticle = { en: LocaleContent; zh: LocaleContent; ja: LocaleContent; de: LocaleContent };

let _key = 0;
function k() { return `k${(++_key).toString(36)}`; }

type PTBlock = { _type: string; _key: string; style?: string; listItem?: string; level?: number; children: unknown[]; markDefs: unknown[] };

function buildBody(keyPoints: string[]): PTBlock[] {
  return keyPoints.slice(0, 3).map((point) => ({
    _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, markDefs: [],
    children: [{ _type: "span", _key: k(), text: point, marks: [] }],
  }));
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export async function saveDraftPost(
  article: GeneratedArticle,
  sourceItemIds: string[],
  audience = "both",
): Promise<{ postId: string; slug: string; mediaTags: string[] }> {
  // Fetch source items for tags
  let combinedTags: string[] = [];
  if (sourceItemIds.length) {
    const items = await writeClient.fetch<{ _id: string; tags?: string[] }[]>(
      `*[_type == "mediaItem" && _id in $ids]{_id, tags}`,
      { ids: sourceItemIds },
      { cache: "no-store" }
    );
    combinedTags = [...new Set(items.flatMap((i) => i.tags ?? []))];
  }

  const slug = slugify(article.en.title);
  const postDoc = {
    _type: "post",
    status: "draft",
    postType: "industry",
    audience,
    ...(combinedTags.length ? { mediaTags: combinedTags } : {}),
    title: { _type: "localizedString", en: article.en.title, zh: article.zh.title, ja: article.ja.title, de: article.de.title },
    slug: { _type: "slug", current: slug },
    publishedAt: new Date().toISOString(),
    excerpt: { _type: "localizedText", en: article.en.summary, zh: article.zh.summary, ja: article.ja.summary, de: article.de.summary },
    body: {
      _type: "localizedBlockContent",
      en: buildBody(article.en.keyPoints),
      zh: buildBody(article.zh.keyPoints),
      ja: buildBody(article.ja.keyPoints),
      de: buildBody(article.de.keyPoints),
    },
  };

  const created = await writeClient.create(postDoc);

  if (sourceItemIds.length) {
    await Promise.all(
      sourceItemIds.map((id) =>
        writeClient.patch(id).set({ generatedPost: { _type: "reference", _ref: created._id }, status: "collected" }).commit()
      )
    );
  }

  return { postId: created._id, slug, mediaTags: combinedTags };
}
