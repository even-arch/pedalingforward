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
  publishedAt?: string;
  status: string;
  relevanceScore?: number;
  relevanceReason?: string;
  hasPost?: boolean;
};

type LocaleArticle = { title: string; excerpt: string; body: string };
type GeneratedArticle = { en: LocaleArticle; zh: LocaleArticle; ja: LocaleArticle; de: LocaleArticle };

const TABS = [
  { key: "collected", label: "✅ 已收錄" },
  { key: "raw", label: "⏳ 待分析" },
  { key: "dismissed", label: "❌ 已排除" },
] as const;

const SCORE_COLOR = (s?: number) => {
  if (!s && s !== 0) return "#8a8278";
  if (s >= 7) return "#4caf50";
  if (s >= 5) return "#ff9800";
  return "#f44336";
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
}

function ArticlePreview({ article, onSave, onClose, saving }: {
  article: GeneratedArticle;
  onSave: (note?: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [locale, setLocale] = useState<"en" | "zh" | "ja" | "de">("en");
  const current = article[locale];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1916", border: "1px solid #2a2824", borderRadius: 8, width: "min(90vw, 720px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #2a2824", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, color: "#e8e4df", flex: 1 }}>預覽文章</span>
          {(["en", "zh", "ja", "de"] as const).map((l) => (
            <button key={l} onClick={() => setLocale(l)}
              style={{ padding: "4px 10px", background: locale === l ? "#D5352A" : "#2a2824", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              {l.toUpperCase()}
            </button>
          ))}
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8a8278", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflow: "auto", flex: 1 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#fff", lineHeight: 1.3 }}>{current.title}</h2>
          <p style={{ margin: "0 0 20px", color: "#a09890", fontSize: 14, fontStyle: "italic" }}>{current.excerpt}</p>
          <div style={{ color: "#c8c4c0", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{current.body}</div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #2a2824", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", background: "#2a2824", color: "#e8e4df", border: "none", borderRadius: 4, cursor: "pointer" }}>取消</button>
          <button onClick={() => onSave()} disabled={saving}
            style={{ padding: "8px 20px", background: saving ? "#6a3020" : "#D5352A", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
            {saving ? "儲存中…" : "儲存草稿"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<string>("collected");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [sourceItemIds, setSourceItemIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editorialNote, setEditorialNote] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await fetch(`/api/admin/media?status=${tab}`, { headers });
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setItems((prev) => prev.filter((it) => it._id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function generate() {
    const ids = [...selected];
    if (!ids.length) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/media/generate", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: ids, editorialNote: editorialNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setGeneratedArticle(data.article);
      setSourceItemIds(data.sourceItemIds);
    } catch (err) {
      showToast(`錯誤: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  async function savePost() {
    if (!generatedArticle) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-post", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ article: generatedArticle, sourceItemIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      showToast(`✅ 已儲存草稿：${data.slug}`);
      setGeneratedArticle(null);
      setSelected(new Set());
      setEditorialNote("");
      load();
    } catch (err) {
      showToast(`儲存失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function triggerFetch() {
    showToast("正在擷取 RSS…");
    const res = await fetch("/api/cron/fetch-rss", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` } });
    const data = await res.json();
    showToast(`擷取完成：新增 ${data.totalNew ?? 0} 筆`);
    if (tab === "raw") load();
  }

  async function triggerFilter() {
    showToast("AI 分析中…");
    const res = await fetch("/api/cron/filter-media", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` } });
    const data = await res.json();
    showToast(`分析完成：處理 ${data.processed ?? 0} 筆`);
    load();
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}

      {/* Article preview modal */}
      {generatedArticle && (
        <ArticlePreview
          article={generatedArticle}
          onSave={savePost}
          onClose={() => setGeneratedArticle(null)}
          saving={saving}
        />
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>情報室</h1>
        <span style={{ flex: 1 }} />
        <button onClick={triggerFetch} style={{ padding: "6px 14px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
          擷取 RSS
        </button>
        <button onClick={triggerFilter} style={{ padding: "6px 14px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
          AI 分析
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #2a2824" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: tab === key ? "2px solid #D5352A" : "2px solid transparent",
              color: tab === key ? "#fff" : "#8a8278",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === key ? 600 : 400,
              marginBottom: -1,
            }}
          >
            {label} {tab === key ? `(${items.length})` : ""}
          </button>
        ))}
      </div>

      {/* Generate bar (shown when items selected in collected tab) */}
      {tab === "collected" && selected.size > 0 && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#1a1916", border: "1px solid #2a2824", borderRadius: 6, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#a09890" }}>已選 {selected.size} 筆</span>
          <input
            placeholder="編輯備注（可選）"
            value={editorialNote}
            onChange={(e) => setEditorialNote(e.target.value)}
            style={{ flex: 1, padding: "6px 10px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#e8e4df", fontSize: 13, outline: "none" }}
          />
          <button
            onClick={generate}
            disabled={generating}
            style={{ padding: "8px 18px", background: generating ? "#6a3020" : "#D5352A", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}
          >
            {generating ? "AI 生成中…" : "✨ 生成文章"}
          </button>
        </div>
      )}

      {/* Item list */}
      {loading ? (
        <div style={{ color: "#8a8278", padding: 32, textAlign: "center" }}>載入中…</div>
      ) : items.length === 0 ? (
        <div style={{ color: "#8a8278", padding: 32, textAlign: "center" }}>
          {tab === "collected" ? "暫無已收錄文章。先執行「AI 分析」來分類文章。" : "暫無資料"}
        </div>
      ) : (
        <div>
          {/* Select all */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", color: "#8a8278", fontSize: 12 }}>
            <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i._id)))} />
            <span>全選</span>
          </div>

          {items.map((item) => (
            <div key={item._id} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "14px 12px", borderBottom: "1px solid #1a1916",
              background: selected.has(item._id) ? "#1a1916" : "transparent",
              cursor: "pointer",
            }} onClick={() => toggle(item._id)}>
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
                <div style={{ display: "flex", gap: 8, color: "#8a8278", fontSize: 12, marginBottom: 4, flexWrap: "wrap" }}>
                  <span>{item.sourceName}</span>
                  {item.sourceLanguage && <span>· {item.sourceLanguage.toUpperCase()}</span>}
                  <span>· {fmt(item.publishedAt)}</span>
                  {item.hasPost && <span style={{ color: "#4caf50" }}>· 已有文章</span>}
                </div>
                {item.description && (
                  <div style={{ color: "#8a8278", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.description}
                  </div>
                )}
                {item.relevanceReason && (
                  <div style={{ color: "#5a5650", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>{item.relevanceReason}</div>
                )}
              </div>
              {/* Quick actions */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {item.status !== "collected" && (
                  <button onClick={() => updateStatus(item._id, "collected")}
                    style={{ padding: "3px 8px", background: "#1e3a1e", border: "1px solid #2a4a2a", color: "#4caf50", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                    收錄
                  </button>
                )}
                {item.status !== "dismissed" && (
                  <button onClick={() => updateStatus(item._id, "dismissed")}
                    style={{ padding: "3px 8px", background: "#2a1e1e", border: "1px solid #4a2a2a", color: "#f44336", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                    排除
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
