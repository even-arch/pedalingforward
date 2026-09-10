import { writeClient } from "@/sanity/lib/write-client";

export type LocaleContent = { title: string; summary: string; keyPoints: string[] };
export type GeneratedArticle = { en: LocaleContent; zh: LocaleContent; ja: LocaleContent; de: LocaleContent };

let _key = 0;
function k() { return `k${(++_key).toString(36)}`; }

type PTBlock = { _type: string; _key: string; style?: string; listItem?: string; level?: number; children: unknown[]; markDefs: unknown[] };
type Source = { url: string; name: string };

function buildBody(summary: string, keyPoints: string[], sources: Source[]): PTBlock[] {
  const blocks: PTBlock[] = [{
    _type: "block", _key: k(), style: "normal", markDefs: [],
    children: [{ _type: "span", _key: k(), text: summary, marks: [] }],
  }];
  for (const point of keyPoints.slice(0, 3)) {
    blocks.push({ _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, markDefs: [], children: [{ _type: "span", _key: k(), text: point, marks: [] }] });
  }
  for (const src of sources.filter((s) => s.url)) {
    const linkKey = k();
    blocks.push({ _type: "block", _key: k(), style: "normal", markDefs: [{ _type: "link", _key: linkKey, href: src.url, blank: true }], children: [{ _type: "span", _key: k(), text: `Source: ${src.name || src.url}`, marks: [linkKey] }] });
  }
  return blocks;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export async function saveDraftPost(
  article: GeneratedArticle,
  sourceItemIds: string[],
  audience = "both",
  primaryUrl?: string,
): Promise<{ postId: string; slug: string }> {
  // Fetch source items
  let sources: Source[] = [];
  let combinedTags: string[] = [];
  if (sourceItemIds.length) {
    const items = await writeClient.fetch<{ _id: string; url?: string; sourceName?: string; tags?: string[] }[]>(
      `*[_type == "mediaItem" && _id in $ids]{_id, url, sourceName, tags}`,
      { ids: sourceItemIds },
      { cache: "no-store" }
    );
    sources = items.map((i) => ({ url: i.url ?? "", name: i.sourceName ?? "" }));
    combinedTags = [...new Set(items.flatMap((i) => i.tags ?? []))];
  }
  if (!sources.length && primaryUrl) {
    sources = [{ url: primaryUrl, name: "" }];
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
      en: buildBody(article.en.summary, article.en.keyPoints, sources),
      zh: buildBody(article.zh.summary, article.zh.keyPoints, sources),
      ja: buildBody(article.ja.summary, article.ja.keyPoints, sources),
      de: buildBody(article.de.summary, article.de.keyPoints, sources),
    },
    sourceUrl: sources[0]?.url,
  };

  const created = await writeClient.create(postDoc);

  if (sourceItemIds.length) {
    await Promise.all(
      sourceItemIds.map((id) =>
        writeClient.patch(id).set({ generatedPost: { _type: "reference", _ref: created._id }, status: "collected" }).commit()
      )
    );
  }

  return { postId: created._id, slug };
}
