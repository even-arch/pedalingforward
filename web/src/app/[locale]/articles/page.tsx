import Link from "next/link";
import { writeClient } from "@/sanity/lib/write-client";
import { urlFor } from "@/sanity/image";
import { loc, formatDate } from "@/lib/locale";

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };

type Post = {
  _id: string;
  title?: LocalizedStr | null;
  slug?: { current?: string | null } | null;
  publishedAt?: string | null;
  postType?: string | null;
  mediaTags?: string[] | null;
  excerpt?: LocalizedStr | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainImage?: { asset?: any; alt?: LocalizedStr | null } | null;
  author?: { name?: string | null } | null;
  category?: { title?: LocalizedStr | null } | null;
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 12;

const POST_TYPES: { value: string; label: Record<string, string> }[] = [
  { value: "",          label: { en: "All",        zh: "全部",     ja: "すべて",   de: "Alle" } },
  { value: "industry",  label: { en: "Industry",   zh: "產業動態", ja: "業界",     de: "Branche" } },
  { value: "product",   label: { en: "Product",    zh: "產品",     ja: "製品",     de: "Produkt" } },
  { value: "test",      label: { en: "Review",     zh: "測試報告", ja: "テスト",   de: "Test" } },
  { value: "shopfloor", label: { en: "Shop Floor", zh: "現場",     ja: "現場",     de: "Werkstatt" } },
  { value: "show",      label: { en: "Show",       zh: "展覽",     ja: "展示会",   de: "Messe" } },
  { value: "history",   label: { en: "History",    zh: "歷史",     ja: "歴史",     de: "Geschichte" } },
];

const TIME_OPTIONS: { value: string; label: Record<string, string> }[] = [
  { value: "",    label: { en: "All time",      zh: "不限時間", ja: "全期間",     de: "Alle" } },
  { value: "30",  label: { en: "Last 30 days",  zh: "近 30 天", ja: "30日以内",   de: "30 Tage" } },
  { value: "90",  label: { en: "Last 3 months", zh: "近 3 個月", ja: "3ヶ月",    de: "3 Monate" } },
  { value: "180", label: { en: "Last 6 months", zh: "近 6 個月", ja: "6ヶ月",    de: "6 Monate" } },
];

const TAG_LABELS: Record<string, Record<string, string>> = {
  "supply-chain":  { en: "Supply Chain",  zh: "供應鏈",   ja: "サプライチェーン", de: "Lieferkette" },
  "product-launch":{ en: "New Product",   zh: "新品發布", ja: "新製品",           de: "Neuheiten" },
  "market-news":   { en: "Market",        zh: "市場動態", ja: "市場",             de: "Markt" },
  "regulation":    { en: "Regulation",    zh: "法規政策", ja: "規制",             de: "Regulierung" },
  "trade-show":    { en: "Trade Show",    zh: "展覽",     ja: "展示会",           de: "Messe" },
  "retail":        { en: "Retail",        zh: "零售通路", ja: "小売",             de: "Handel" },
  "tech":          { en: "Tech",          zh: "技術規格", ja: "技術",             de: "Technik" },
  "e-bike":        { en: "E-Bike",        zh: "電動車",   ja: "電動自転車",       de: "E-Bike" },
  "urban":         { en: "Urban",         zh: "城市騎行", ja: "アーバン",         de: "Urban" },
  "gravel":        { en: "Gravel",        zh: "越野",     ja: "グラベル",         de: "Gravel" },
  "mtb":           { en: "MTB",           zh: "登山車",   ja: "MTB",             de: "MTB" },
  "road":          { en: "Road",          zh: "公路車",   ja: "ロード",           de: "Rennrad" },
  "cargo-bike":    { en: "Cargo Bike",    zh: "貨運自行車", ja: "カーゴバイク",   de: "Lastenrad" },
  "shimano":       { en: "Shimano",       zh: "Shimano",  ja: "シマノ",           de: "Shimano" },
  "sram":          { en: "SRAM",          zh: "SRAM",     ja: "SRAM",             de: "SRAM" },
  "campagnolo":    { en: "Campagnolo",    zh: "Campagnolo", ja: "カンパニョーロ", de: "Campagnolo" },
  "bosch":         { en: "Bosch",         zh: "Bosch",    ja: "ボッシュ",         de: "Bosch" },
  "carbon-fiber":  { en: "Carbon",        zh: "碳纖維",   ja: "カーボン",         de: "Carbon" },
  "aluminum":      { en: "Aluminum",      zh: "鋁合金",   ja: "アルミ",           de: "Aluminium" },
};

const PAGE_LABELS: Record<string, Record<string, string>> = {
  heading:  { en: "All Articles", zh: "所有文章", ja: "記事一覧", de: "Alle Artikel" },
  filter:   { en: "Filter",       zh: "篩選",     ja: "絞り込み", de: "Filter" },
  tags:     { en: "Topics",       zh: "主題",     ja: "トピック", de: "Themen" },
  period:   { en: "Period",       zh: "時間",     ja: "期間",     de: "Zeitraum" },
  results:  { en: "articles",     zh: "篇文章",   ja: "件の記事", de: "Artikel" },
  none:     { en: "No articles found for these filters.", zh: "沒有符合條件的文章。", ja: "記事が見つかりません。", de: "Keine Artikel gefunden." },
  prev:     { en: "← Prev",       zh: "← 上一頁", ja: "← 前へ",   de: "← Zurück" },
  next:     { en: "Next →",       zh: "下一頁 →", ja: "次へ →",   de: "Weiter →" },
  clearAll: { en: "Clear filters", zh: "清除篩選", ja: "リセット", de: "Zurücksetzen" },
};

function t(key: keyof typeof PAGE_LABELS, locale: string): string {
  return PAGE_LABELS[key]?.[locale] ?? PAGE_LABELS[key]?.["en"] ?? "";
}

function tagLabel(tag: string, locale: string): string {
  return TAG_LABELS[tag]?.[locale] ?? TAG_LABELS[tag]?.["en"] ?? tag;
}

function buildUrl(locale: string, overrides: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  if (overrides.tag)   sp.set("tag", overrides.tag);
  if (overrides.type)  sp.set("type", overrides.type);
  if (overrides.since) sp.set("since", overrides.since);
  if (overrides.page && overrides.page !== "1") sp.set("page", overrides.page);
  const qs = sp.toString();
  return `/${locale}/articles${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = { en: "All Articles", zh: "所有文章", ja: "記事一覧", de: "Alle Artikel" };
  return { title: `${titles[locale] ?? "Articles"} — Pedaling Forward` };
}

export default async function ArticlesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const activeTag  = (Array.isArray(sp.tag)   ? sp.tag[0]   : sp.tag)   ?? "";
  const activeType = (Array.isArray(sp.type)  ? sp.type[0]  : sp.type)  ?? "";
  const since      = (Array.isArray(sp.since) ? sp.since[0] : sp.since) ?? "";
  const page       = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10));
  const offset     = (page - 1) * PAGE_SIZE;

  const hasFilters = !!(activeTag || activeType || since);

  const sinceFilter = since    ? `&& dateTime(publishedAt) > dateTime(now()) - ${parseInt(since, 10) * 86400}` : "";
  const typeFilter  = activeType ? `&& postType == "${activeType}"` : "";
  const tagFilter   = activeTag  ? `&& "${activeTag}" in mediaTags` : "";
  const baseFilter  = `_type == "post" && status == "published"${sinceFilter}${typeFilter}${tagFilter}`;

  const postQuery = `*[${baseFilter}] | order(publishedAt desc) [${offset}...${offset + PAGE_SIZE}]{
    _id, title, slug, publishedAt, postType, mediaTags,
    excerpt,
    "mainImage": mainImage{asset->, "alt": alt},
    "author": author->{name},
    "category": category->{title}
  }`;
  const countQuery  = `count(*[${baseFilter}])`;
  const tagsQuery   = `array::unique(*[_type == "post" && status == "published" && defined(mediaTags)].mediaTags[])`;

  const [posts, total, allTagsRaw] = await Promise.all([
    writeClient.fetch<Post[]>(postQuery, {}, { cache: "no-store" }),
    writeClient.fetch<number>(countQuery, {}, { cache: "no-store" }),
    writeClient.fetch<string[]>(tagsQuery, {}, { cache: "no-store" }).catch(() => [] as string[]),
  ]);

  // Sort tags: known labels first, then alphabetically
  const allTags = [...new Set(allTagsRaw)].sort((a, b) => {
    const aKnown = !!TAG_LABELS[a], bKnown = !!TAG_LABELS[b];
    if (aKnown && !bKnown) return -1;
    if (!aKnown && bKnown) return 1;
    return a.localeCompare(b);
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      {/* Page header */}
      <div className="field-ink phead" style={{ paddingBlock: "56px 48px" }}>
        <div className="wrap">
          <h1 className="display" style={{ marginBottom: 0 }}>{t("heading", locale)}</h1>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 96 }}>
        {/* ── Filter bar ── */}
        <div style={{ marginBottom: 40, display: "flex", flexDirection: "column", gap: 16, padding: "20px 0", borderBottom: "1px solid #DDD8D1" }}>

          {/* Type filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#aaa09a", marginRight: 6, minWidth: 44, flexShrink: 0 }}>{t("filter", locale)}</span>
            {POST_TYPES.map((pt) => {
              const active = activeType === pt.value;
              const href = buildUrl(locale, { tag: activeTag || undefined, type: pt.value || undefined, since: since || undefined });
              return (
                <Link key={pt.value} href={href}
                  style={{
                    padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: active ? 700 : 400,
                    background: active ? "#1D1D1B" : "transparent",
                    color: active ? "#fff" : "#6E6760",
                    border: `1px solid ${active ? "#1D1D1B" : "#DDD8D1"}`,
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}>
                  {pt.label[locale] ?? pt.label.en}
                </Link>
              );
            })}
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#aaa09a", marginRight: 6, minWidth: 44, flexShrink: 0 }}>{t("tags", locale)}</span>
              {allTags.map((tag) => {
                const active = activeTag === tag;
                const href = buildUrl(locale, {
                  tag: active ? undefined : tag,
                  type: activeType || undefined,
                  since: since || undefined,
                });
                return (
                  <Link key={tag} href={href}
                    style={{
                      padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: active ? 700 : 400,
                      background: active ? "#D5352A" : "transparent",
                      color: active ? "#fff" : "#6E6760",
                      border: `1px solid ${active ? "#D5352A" : "#DDD8D1"}`,
                      textDecoration: "none", whiteSpace: "nowrap",
                    }}>
                    {tagLabel(tag, locale)}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Time filter */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#aaa09a", marginRight: 6, minWidth: 44, flexShrink: 0 }}>{t("period", locale)}</span>
            {TIME_OPTIONS.map((opt) => {
              const active = since === opt.value;
              const href = buildUrl(locale, { tag: activeTag || undefined, type: activeType || undefined, since: opt.value || undefined });
              return (
                <Link key={opt.value} href={href}
                  style={{
                    padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: active ? 700 : 400,
                    background: active ? "#1D1D1B" : "transparent",
                    color: active ? "#fff" : "#6E6760",
                    border: `1px solid ${active ? "#1D1D1B" : "#DDD8D1"}`,
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}>
                  {opt.label[locale] ?? opt.label.en}
                </Link>
              );
            })}
            {hasFilters && (
              <Link href={`/${locale}/articles`}
                style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, color: "#D5352A", border: "1px solid #D5352A", textDecoration: "none", marginLeft: 8 }}>
                {t("clearAll", locale)}
              </Link>
            )}
          </div>
        </div>

        {/* Result count */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#1D1D1B" }}>
            {total}
          </span>
          <span style={{ fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 11, color: "#6E6760", letterSpacing: "0.1em" }}>
            {t("results", locale)}
          </span>
        </div>

        {/* Feed */}
        {posts.length === 0 ? (
          <p style={{ color: "#6E6760", padding: "48px 0", textAlign: "center" }}>{t("none", locale)}</p>
        ) : (
          <div className="feed">
            {posts.map((post, idx) => {
              const title    = loc(post.title, locale);
              const excerpt  = loc(post.excerpt, locale);
              const date     = formatDate(post.publishedAt, locale);
              const postTypeLabel = POST_TYPES.find((pt) => pt.value === post.postType)?.label[locale]
                ?? POST_TYPES.find((pt) => pt.value === post.postType)?.label.en ?? "";
              const isLead = idx === 0 && page === 1;

              return (
                <Link key={post._id}
                  href={`/${locale}/articles/${post.slug?.current ?? ""}`}
                  className={`item${isLead ? " lead-item" : ""}`}>
                  <div className="ph">
                    {post.mainImage?.asset ? (
                      <img
                        src={urlFor(post.mainImage as Parameters<typeof urlFor>[0])
                          .width(isLead ? 900 : 600).height(isLead ? 506 : 450).fit("crop").url()}
                        alt={loc(post.mainImage.alt, locale) ?? title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="hatch" />
                    )}
                  </div>

                  {/* Tags row */}
                  {(post.mediaTags?.length ?? 0) > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: -4 }}>
                      {post.mediaTags!.slice(0, 4).map((tag) => (
                        <span key={tag} style={{
                          fontFamily: "var(--font-ibm-mono, monospace)",
                          fontSize: 9.5, fontWeight: 600, letterSpacing: "0.14em",
                          textTransform: "uppercase", color: "#8a7a70",
                          padding: "2px 7px", borderRadius: 99,
                          border: "1px solid #DDD8D1",
                        }}>
                          {tagLabel(tag, locale)}
                        </span>
                      ))}
                    </div>
                  )}

                  {postTypeLabel && <span className="kind">{postTypeLabel}</span>}
                  <h3>{title}</h3>
                  {excerpt && <p className="dek">{excerpt}</p>}
                  <div className="meta">{[post.author?.name, date].filter(Boolean).join(" · ")}</div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 64, flexWrap: "wrap" }}>
            {page > 1 && (
              <Link href={buildUrl(locale, { tag: activeTag || undefined, type: activeType || undefined, since: since || undefined, page: String(page - 1) })}
                style={{ padding: "8px 20px", border: "1px solid #DDD8D1", borderRadius: 4, fontSize: 13, color: "#1D1D1B", textDecoration: "none" }}>
                {t("prev", locale)}
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} style={{ padding: "8px 4px", color: "#6E6760", fontSize: 13 }}>…</span>
                ) : (
                  <Link key={p} href={buildUrl(locale, { tag: activeTag || undefined, type: activeType || undefined, since: since || undefined, page: p === 1 ? undefined : String(p) })}
                    style={{
                      padding: "8px 16px", border: "1px solid", borderRadius: 4, fontSize: 13, textDecoration: "none",
                      borderColor: p === page ? "#1D1D1B" : "#DDD8D1",
                      background: p === page ? "#1D1D1B" : "transparent",
                      color: p === page ? "#fff" : "#1D1D1B",
                    }}>
                    {p}
                  </Link>
                )
              )}
            {page < totalPages && (
              <Link href={buildUrl(locale, { tag: activeTag || undefined, type: activeType || undefined, since: since || undefined, page: String(page + 1) })}
                style={{ padding: "8px 20px", border: "1px solid #DDD8D1", borderRadius: 4, fontSize: 13, color: "#1D1D1B", textDecoration: "none" }}>
                {t("next", locale)}
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
