"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../layout";

type MediaItem = {
  _id: string;
  title: string;
  url: string;
  sourceName?: string;
  sourceLanguage?: string;
  description?: string;
  summary?: string;
  keyPoints?: string[];
  tags?: string[];
  publishedAt?: string;
  status: string;
  relevanceScore?: number;
  relevanceReason?: string;
  fullTextFetched?: boolean;
  hasPost?: boolean;
};

type LocaleContent = { title: string; summary: string; keyPoints: string[] };
type GeneratedArticle = { en: LocaleContent; zh: LocaleContent; ja: LocaleContent; de: LocaleContent };
type Counts = { raw: number; analyzed: number; collected: number; dismissed: number };

const TABS = [
  { key: "raw",      label: "待分析",  color: "#8a8278" },
  { key: "analyzed", label: "已分析",  color: "#f59e0b" },
  { key: "collected",label: "已收錄",  color: "#4caf50" },
  { key: "dismissed",label: "已排除",  color: "#f44336" },
] as const;

const TAG_LABELS: Record<string, string> = {
  "supply-chain":  "供應鏈",
  "product-launch":"新品",
  "market-news":   "市場動態",
  "regulation":    "法規政策",
  "trade-show":    "展覽",
  "retail":        "零售通路",
  "tech":          "技術規格",
  "e-bike":        "電動車",
};

const AUDIENCE_OPTIONS = [
  { value: "supplier", label: "🏭 供應商（zh only）" },
  { value: "shop",     label: "🏪 車店（en/de/ja）" },
  { value: "both",     label: "🌐 兩者（全語言）" },
];

const SCORE_COLOR = (s?: number) => {
  if (s === undefined || s === null) return "#8a8278";
  if (s >= 7) return "#4caf50";
  if (s >= 5) return "#f59e0b";
  return "#f44336";
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
}

function TagChip({ tag, active, onClick }: { tag: string; active?: boolean; onClick?: () => void }) {
  return (
    <span onClick={onClick} style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, cursor: onClick ? "pointer" : "default",
      background: active ? "#D5352A" : "#2a2824", color: active ? "#fff" : "#a09890",
      border: `1px solid ${active ? "#D5352A" : "#3a3530"}`, userSelect: "none",
    }}>
      {TAG_LABELS[tag] ?? tag}
    </span>
  );
}

function ArticlePreview({ article, primaryUrl, sourceName, onSave, onClose, saving }: {
  article: GeneratedArticle; primaryUrl?: string; sourceName?: string;
  onSave: (audience: string) => void; onClose: () => void; saving: boolean;
}) {
  const [locale, setLocale] = useState<"en" | "zh" | "ja" | "de">("zh");
  const [audience, setAudience] = useState("supplier");
  const current = article[locale];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1916", border: "1px solid #2a2824", borderRadius: 8, width: "min(92vw, 680px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #2a2824", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "#e8e4df", fontSize: 15 }}>預覽摘要</span>
          <span style={{ flex: 1 }} />
          {(["zh", "en", "ja", "de"] as const).map((l) => (
            <button key={l} onClick={() => setLocale(l)}
              style={{ padding: "4px 10px", background: locale === l ? "#D5352A" : "#2a2824", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              {l.toUpperCase()}
            </button>
          ))}
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a8278", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: "22px", overflow: "auto", flex: 1 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 20, color: "#fff", lineHeight: 1.3 }}>{current.title}</h2>
          <p style={{ margin: "0 0 16px", color: "#c8c4c0", fontSize: 14, lineHeight: 1.7 }}>{current.summary}</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            {(current.keyPoints ?? []).map((pt, i) => (
              <li key={i} style={{ color: "#a09890", fontSize: 13, lineHeight: 1.7, marginBottom: 4 }}>{pt}</li>
            ))}
          </ul>
          {primaryUrl && (
            <div style={{ fontSize: 12, color: "#5a5650" }}>
              來源：<a href={primaryUrl} target="_blank" rel="noopener" style={{ color: "#8a8278" }}>{sourceName || primaryUrl}</a>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #2a2824", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#8a8278" }}>受眾：</span>
            <select value={audience} onChange={(e) => setAudience(e.target.value)}
              style={{ padding: "4px 8px", background: "#0f0e0c", border: "1px solid #2a2824", color: "#e8e4df", borderRadius: 4, fontSize: 12 }}>
              {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: "7px 18px", background: "#2a2824", color: "#e8e4df", border: "none", borderRadius: 4, cursor: "pointer" }}>取消</button>
          <button onClick={() => onSave(audience)} disabled={saving}
            style={{ padding: "7px 18px", background: saving ? "#6a3020" : "#D5352A", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
            {saving ? "儲存中…" : "儲存草稿"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<string>("analyzed");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [genMeta, setGenMeta] = useState<{ sourceItemIds: string[]; primaryUrl?: string; sourceName?: string }>({ sourceItemIds: [] });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editorialNote, setEditorialNote] = useState("");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadCounts = useCallback(async () => {
    const res = await fetch("/api/admin/media?status=counts", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCounts((await res.json()).counts);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    setActiveTag(null);
    try {
      const res = await fetch(`/api/admin/media?status=${tab}`, { headers: { Authorization: `Bearer ${token}` } });
      setItems((await res.json()).items ?? []);
    } finally {
      setLoading(false);
    }
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 4000); }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/media", { method: "PATCH", headers, body: JSON.stringify({ id, status }) });
    setItems((prev) => prev.filter((it) => it._id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    loadCounts();
  }

  async function bulkCollect() {
    const ids = [...selected];
    if (!ids.length) return;
    await Promise.all(ids.map((id) =>
      fetch("/api/admin/media", { method: "PATCH", headers, body: JSON.stringify({ id, status: "collected" }) })
    ));
    setItems((prev) => prev.filter((it) => !ids.includes(it._id)));
    setSelected(new Set());
    loadCounts();
    showToast(`✅ 已收錄 ${ids.length} 篇`);
  }

  async function generate() {
    const ids = [...selected];
    if (!ids.length) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/media/generate", {
        method: "POST", headers,
        body: JSON.stringify({ itemIds: ids, editorialNote: editorialNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setGeneratedArticle(data.article);
      const firstItem = items.find((it) => ids.includes(it._id));
      setGenMeta({ sourceItemIds: data.sourceItemIds, primaryUrl: data.primaryUrl, sourceName: firstItem?.sourceName });
    } catch (err) {
      showToast(`錯誤: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  async function savePost(audience: string) {
    if (!generatedArticle) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-post", {
        method: "POST", headers,
        body: JSON.stringify({ article: generatedArticle, sourceItemIds: genMeta.sourceItemIds, primaryUrl: genMeta.primaryUrl, sourceName: genMeta.sourceName, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      showToast(`✅ 已儲存：${data.slug}`);
      setGeneratedArticle(null);
      setSelected(new Set());
      setEditorialNote("");
      load();
      loadCounts();
    } catch (err) {
      showToast(`儲存失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function triggerCron(path: string, label: string, doneLabel: (d: Record<string, number>) => string) {
    showToast(`${label}中…`);
    try {
      const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      showToast(doneLabel(data));
      load();
      loadCounts();
    } catch {
      showToast(`${label} 失敗`);
    }
  }

  async function retag() {
    showToast("補打標籤中…");
    try {
      const res = await fetch("/api/admin/retag", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message ?? `✅ 已補打 ${data.tagged} 篇`);
      load();
    } catch (err) {
      showToast(`失敗: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function seedSources() {
    showToast("匯入預設 RSS 來源中…");
    try {
      const res = await fetch("/api/admin/seed-sources", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message ?? `✅ 已匯入 ${data.inserted} 個來源`);
    } catch (err) {
      showToast(`匯入失敗: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Collect all unique tags from current items
  const allTags = Array.from(new Set(items.flatMap((it) => it.tags ?? []))).sort();

  const filtered = items.filter((it) => {
    if (search && !it.title.toLowerCase().includes(search.toLowerCase()) && !it.sourceName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTag && !(it.tags ?? []).includes(activeTag)) return false;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((it) => selected.has(it._id));
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const tabCount = (key: string) => counts ? ` (${counts[key as keyof Counts] ?? 0})` : "";

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14, maxWidth: 320 }}>
          {toast}
        </div>
      )}

      {generatedArticle && (
        <ArticlePreview article={generatedArticle} primaryUrl={genMeta.primaryUrl} sourceName={genMeta.sourceName}
          onSave={savePost} onClose={() => setGeneratedArticle(null)} saving={saving} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>情報室</h1>
        <span style={{ flex: 1 }} />
        <button onClick={retag}
          style={{ padding: "6px 12px", background: "#1a2a1a", border: "1px solid #2a402a", color: "#a0c0a0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          補打標籤
        </button>
        <button onClick={seedSources}
          style={{ padding: "6px 12px", background: "#1a1a2e", border: "1px solid #2a2844", color: "#8a9adf", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          匯入預設來源
        </button>
        <button onClick={() => triggerCron("/api/cron/fetch-rss", "擷取 RSS", (d) => `擷取完成：新增 ${d.totalNew ?? 0} 筆`)}
          style={{ padding: "6px 12px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          擷取 RSS
        </button>
        <button onClick={() => triggerCron("/api/cron/filter-media", "AI 分析", (d) => `分析完成：${d.analyzed ?? 0} 篇進已分析，${d.dismissed ?? 0} 篇自動排除`)}
          style={{ padding: "6px 12px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          AI 分析
        </button>
        <button onClick={() => triggerCron("/api/cron/enrich-media", "AI 摘要", (d) => `摘要完成：${d.enriched ?? 0} 篇`)}
          style={{ padding: "6px 12px", background: "#1a2a1a", border: "1px solid #2a402a", color: "#4caf50", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          AI 摘要
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #2a2824" }}>
        {TABS.map(({ key, label, color }) => (
          <button key={key} onClick={() => { setTab(key); setSearch(""); }}
            style={{ padding: "8px 18px", background: "none", border: "none", borderBottom: tab === key ? `2px solid ${color}` : "2px solid transparent", color: tab === key ? color : "#5a5650", cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 600 : 400, marginBottom: -1, whiteSpace: "nowrap" }}>
            {label}{tabCount(key)}
          </button>
        ))}
      </div>

      {/* Search + tag filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋標題或來源…"
          style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#e8e4df", fontSize: 13, outline: "none" }} />
        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#5a5650" }}>標籤：</span>
            {activeTag && (
              <TagChip tag="全部" active={false} onClick={() => setActiveTag(null)} />
            )}
            {allTags.map((tag) => (
              <TagChip key={tag} tag={tag} active={activeTag === tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} />
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "#1a1916", border: "1px solid #2a2824", borderRadius: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#a09890", flexShrink: 0 }}>已選 {selected.size} 篇</span>
          {tab === "analyzed" && (
            <button onClick={bulkCollect}
              style={{ padding: "6px 14px", background: "#1e3a1e", border: "1px solid #2a4a2a", color: "#4caf50", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              ✅ 批次收錄
            </button>
          )}
          {tab === "collected" && (
            <>
              <input placeholder="編輯備注（可選，會傳給 AI）" value={editorialNote} onChange={(e) => setEditorialNote(e.target.value)}
                style={{ flex: 1, minWidth: 120, padding: "6px 10px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#e8e4df", fontSize: 13, outline: "none" }} />
              <button onClick={generate} disabled={generating}
                style={{ padding: "7px 16px", background: generating ? "#6a3020" : "#D5352A", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                {generating ? "AI 生成中…" : "✨ 生成摘要"}
              </button>
            </>
          )}
          <button onClick={() => selected.forEach((id) => updateStatus(id, "dismissed"))}
            style={{ padding: "6px 12px", background: "#2a1e1e", border: "1px solid #4a2a2a", color: "#f44336", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
            批次排除
          </button>
          <button onClick={() => setSelected(new Set())}
            style={{ padding: "6px 12px", background: "none", border: "1px solid #2a2824", color: "#8a8278", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
            取消
          </button>
        </div>
      )}

      {/* Item list */}
      {loading ? (
        <div style={{ color: "#8a8278", padding: 32, textAlign: "center" }}>載入中…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#8a8278", padding: 32, textAlign: "center" }}>
          {search || activeTag ? "無符合條件的文章" : tab === "raw" ? "暫無待分析文章。按「擷取 RSS」拉進來。" : tab === "analyzed" ? "暫無已分析文章。按「AI 分析」處理待分析文章。" : tab === "collected" ? "暫無已收錄文章。從已分析選取後收錄。" : "暫無已排除文章。"}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", color: "#5a5650", fontSize: 12, borderBottom: "1px solid #1a1916" }}>
            <input type="checkbox" checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map((i) => i._id)))} />
            <span>全選（{filtered.length} 篇）</span>
          </div>

          {filtered.map((item) => (
            <div key={item._id}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 12px", borderBottom: "1px solid #1a1916", background: selected.has(item._id) ? "#1a1916" : "transparent", cursor: "pointer" }}
              onClick={() => toggle(item._id)}>
              <input type="checkbox" checked={selected.has(item._id)} onChange={() => toggle(item._id)} onClick={(e) => e.stopPropagation()} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <a href={item.url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                    style={{ color: "#e8e4df", fontWeight: 600, fontSize: 14, textDecoration: "none", flex: 1 }}>
                    {item.title}
                  </a>
                  {item.relevanceScore !== undefined && (
                    <span style={{ color: SCORE_COLOR(item.relevanceScore), fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {item.relevanceScore}/10
                    </span>
                  )}
                </div>

                {/* Tags */}
                {(item.tags?.length ?? 0) > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 5 }} onClick={(e) => e.stopPropagation()}>
                    {item.tags!.map((tag) => (
                      <TagChip key={tag} tag={tag} active={activeTag === tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} />
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, color: "#8a8278", fontSize: 12, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ color: "#6a6460", fontWeight: 500 }}>{item.sourceName}</span>
                  {item.sourceLanguage && <span>· {item.sourceLanguage.toUpperCase()}</span>}
                  <span>· {fmt(item.publishedAt)}</span>
                  {item.fullTextFetched && <span style={{ color: "#4caf50" }}>· 全文已抓</span>}
                  {item.hasPost && <span style={{ color: "#4caf50" }}>· 已建草稿</span>}
                </div>

                {item.summary ? (
                  <div style={{ color: "#a09890", fontSize: 12, lineHeight: 1.6, marginBottom: 4 }}>{item.summary}</div>
                ) : item.description ? (
                  <div style={{ color: "#6a6460", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.description}
                  </div>
                ) : null}

                {item.relevanceReason && (
                  <div style={{ color: "#5a5650", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>{item.relevanceReason}</div>
                )}
              </div>

              {/* Per-item action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {tab === "analyzed" && (
                  <button onClick={() => updateStatus(item._id, "collected")}
                    style={{ padding: "4px 10px", background: "#1e3a1e", border: "1px solid #2a4a2a", color: "#4caf50", borderRadius: 3, cursor: "pointer", fontSize: 11, whiteSpace: "nowrap" }}>
                    收錄
                  </button>
                )}
                {tab === "collected" && (
                  <button onClick={() => updateStatus(item._id, "analyzed")}
                    style={{ padding: "4px 10px", background: "#1a1916", border: "1px solid #3a3530", color: "#8a8278", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                    退回
                  </button>
                )}
                {tab !== "dismissed" && (
                  <button onClick={() => updateStatus(item._id, "dismissed")}
                    style={{ padding: "4px 10px", background: "#2a1e1e", border: "1px solid #4a2a2a", color: "#f44336", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                    排除
                  </button>
                )}
                {tab === "dismissed" && (
                  <button onClick={() => updateStatus(item._id, "analyzed")}
                    style={{ padding: "4px 10px", background: "#1e1c19", border: "1px solid #3a3530", color: "#8a8278", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                    還原
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
