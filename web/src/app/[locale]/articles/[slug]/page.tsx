import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "next-sanity";
import { writeClient } from "@/sanity/lib/write-client";
import { postBySlugQuery } from "@/sanity/queries/post";
import { urlFor } from "@/sanity/image";
import { loc, formatDate } from "@/lib/locale";

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };

type Post = {
  _id: string;
  title?: LocalizedStr | null;
  slug?: { current?: string | null } | null;
  publishedAt?: string | null;
  postType?: string | null;
  excerpt?: LocalizedStr | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: { en?: any[]; zh?: any[]; ja?: any[]; de?: any[] } | null;
  editorialNote?: string | null;
  sourceUrl?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainImage?: { asset?: any; alt?: LocalizedStr | null; caption?: LocalizedStr | null } | null;
  author?: { name?: string | null } | null;
  category?: { title?: LocalizedStr | null } | null;
  relatedBrands?: { _id: string; name?: string | null }[] | null;
  mediaItems?: { _id: string; title: string; url: string; sourceName?: string | null }[] | null;
};

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const post = await writeClient.fetch<Post>(postBySlugQuery, { slug }, { cache: "no-store" });
  if (!post) return {};
  const title = loc(post.title, locale) || "Article";
  return {
    title: `${title} — Pedaling Forward`,
    description: loc(post.excerpt, locale),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeComponents(locale: string): PortableTextComponents {
  return {
    types: {
      image: ({ value }) => {
        if (!value?.asset) return null;
        const alt = typeof value.alt === "object" ? loc(value.alt as LocalizedStr, locale) : (value.alt ?? "");
        const caption = typeof value.caption === "object" ? loc(value.caption as LocalizedStr, locale) : (value.caption ?? "");
        return (
          <figure className="article-figure">
            <img src={urlFor(value).width(960).fit("max").url()} alt={alt} />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        );
      },
    },
    marks: {
      link: ({ value, children }) => (
        <a href={value?.href} target={value?.blank ? "_blank" : undefined} rel="noopener noreferrer">
          {children}
        </a>
      ),
    },
    block: {
      h2: ({ children }) => <h2 className="article-h2">{children}</h2>,
      h3: ({ children }) => <h3 className="article-h3">{children}</h3>,
      blockquote: ({ children }) => <blockquote className="article-quote">{children}</blockquote>,
    },
  };
}

const POST_TYPE_LABELS: Record<string, Record<string, string>> = {
  industry:  { en: "Industry", zh: "產業動態", ja: "業界ニュース", de: "Branche" },
  product:   { en: "Product",  zh: "產品",     ja: "製品",         de: "Produkt" },
  test:      { en: "Review",   zh: "測試報告", ja: "テスト",       de: "Test" },
  shopfloor: { en: "Shop Floor", zh: "現場",   ja: "現場",         de: "Werkstatt" },
  show:      { en: "Show",     zh: "展覽",     ja: "展示会",       de: "Messe" },
  history:   { en: "History",  zh: "歷史",     ja: "歴史",         de: "Geschichte" },
};

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const post = await writeClient.fetch<Post>(postBySlugQuery, { slug }, { cache: "no-store" });

  if (!post) notFound();

  const title    = loc(post.title, locale);
  const excerpt  = loc(post.excerpt, locale);
  const category = loc(post.category?.title, locale);
  const date     = formatDate(post.publishedAt, locale);
  const typeLabel = post.postType ? (POST_TYPE_LABELS[post.postType]?.[locale] ?? POST_TYPE_LABELS[post.postType]?.en) : null;
  const bodyBlocks = post.body?.[locale as keyof typeof post.body] ?? post.body?.en;
  const components = makeComponents(locale);

  const metaLine = [typeLabel ?? category, date, post.author?.name].filter(Boolean).join(" · ");

  return (
    <>
      {/* Hero image */}
      {post.mainImage?.asset && (
        <div className="article-hero-img">
          <img
            src={urlFor(post.mainImage).width(1440).height(600).fit("crop").url()}
            alt={loc(post.mainImage.alt, locale)}
          />
        </div>
      )}

      <article className="wrap article-body">

        {/* Meta: category · date · author */}
        <div className="article-meta">
          <Link href={`/${locale}/articles`} className="article-back">← {locale === "zh" ? "所有文章" : locale === "ja" ? "記事一覧" : locale === "de" ? "Alle Artikel" : "All articles"}</Link>
          {metaLine && <span className="lab">{metaLine}</span>}
        </div>

        {/* Title */}
        <h1 className="article-title">{title}</h1>

        {/* Editorial note */}
        {post.editorialNote && (
          <div className="article-note">
            <span className="lab">{locale === "zh" ? "編輯觀點" : locale === "ja" ? "編集者より" : locale === "de" ? "Redaktion" : "Editor's take"}</span>
            <p>{post.editorialNote}</p>
          </div>
        )}

        {/* Excerpt / lead */}
        {excerpt && <p className="article-lead">{excerpt}</p>}

        {/* 情報來源 — shown right after lead, before body */}
        {post.mediaItems && post.mediaItems.length > 0 && (
          <div className="article-sources">
            <span className="lab">{locale === "zh" ? "情報來源" : locale === "ja" ? "情報ソース" : locale === "de" ? "Quellen" : "Sources"}</span>
            <ul className="article-source-list">
              {post.mediaItems.map((m) => (
                <li key={m._id}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer">{m.title}</a>
                  {m.sourceName && <span className="article-source-name"> · {m.sourceName}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Body */}
        {bodyBlocks && bodyBlocks.length > 0 && (
          <div className="article-prose">
            <PortableText value={bodyBlocks} components={components} />
          </div>
        )}

        {/* Related brands */}
        {post.relatedBrands && post.relatedBrands.length > 0 && (
          <div className="article-brands">
            <span className="lab">{locale === "zh" ? "相關品牌" : locale === "ja" ? "関連ブランド" : locale === "de" ? "Marken" : "Brands"}</span>
            <div className="article-brand-list">
              {post.relatedBrands.map((b) => (
                <span key={b._id} className="article-brand-tag">{b.name}</span>
              ))}
            </div>
          </div>
        )}

      </article>
    </>
  );
}
