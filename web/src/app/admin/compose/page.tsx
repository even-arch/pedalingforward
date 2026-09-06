"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../layout";

type LocaleKey = "en" | "zh" | "ja" | "de";

type DraftPost = {
  _id: string;
  _createdAt: string;
  status: string;
  postType?: string;
  audience?: string;
  editorialNote?: string;
  title?: Record<LocaleKey, string>;
  excerpt?: Record<LocaleKey, string>;
  slug?: { current: string };
  sourceUrl?: string;
  mediaItems?: { _id: string; title: string; url: string; sourceName?: string }[];
};

const LOCALES: LocaleKey[] = ["zh", "en", "ja", "de"];
const AUDIENCE_OPTIONS = [
  { value: "supplier", label: "🏭 供應商（zh）" },
  { value: "shop", label: "🏪 車店（en/de/ja）" },
  { value: "both", label: "🌐 兩者（全語言）" },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function EditPane({ post, token, onDone }: { post: DraftPost; token: string; onDone: () => void }) {
  const [title, setTitle] = useState<Record<LocaleKey, string>>({
    zh: post.title?.zh ?? "", en: post.title?.en ?? "", ja: post.title?.ja ?? "", de: post.title?.de ?? "",
  });
  const [excerpt, setExcerpt] = useState<Record<LocaleKey, string>>({
    zh: post.excerpt?.zh ?? "", en: post.excerpt?.en ?? "", ja: post.excerpt?.ja ?? "", de: post.excerpt?.de ?? "",
  });
  const [editorialNote, setEditorialNote] = useState(post.editorialNote ?? "");
  const [audience, setAudience] = useState(post.audience ?? "both");
  const [sourceUrl, setSourceUrl] = useState(post.sourceUrl ?? "");
  const [activeLocale, setActiveLocale] = useState<LocaleKey>("zh");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: post._id, action: "update", title, excerpt, editorialNote, audience, sourceUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("✅ 已儲存");
    } catch (err) {
      showToast(`儲存失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      // Save first, then publish
      await fetch("/api/admin/posts", {
        method: "PATCH", headers,
        body: JSON.stringify({ id: post._id, action: "update", title, excerpt, editorialNote, audience, sourceUrl }),
      });
      const res = await fetch("/api/admin/posts", {
        method: "PATCH", headers,
        body: JSON.stringify({ id: post._id, action: "publish" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("🚀 已發布！");
      setTimeout(onDone, 1000);
    } catch (err) {
      showToast(`發布失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPublishing(false);
    }
  }

  const inputBase: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#e8e4df", fontSize: 13, outline: "none" };
  const labelBase: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#8a8278", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 300, fontSize: 14 }}>{toast}</div>}

      <div style={{ background: "#141210", border: "1px solid #2a2824", borderRadius: 8, width: "min(96vw, 780px)", maxHeight: "95vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2824", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: 15, flex: 1 }}>草稿編輯</span>
          <span style={{ fontSize: 11, color: "#5a5650" }}>{post.slug?.current}</span>
          <button onClick={onDone} style={{ background: "none", border: "none", color: "#8a8278", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ overflow: "auto", flex: 1, padding: "20px" }}>
          {/* Editorial note — the critical one-liner */}
          <div style={{ marginBottom: 20, padding: 14, background: "#1a1c1a", border: "1px solid #2a402a", borderRadius: 6 }}>
            <label style={{ ...labelBase, color: "#4caf50" }}>編輯備注 — 你的一句話判斷</label>
            <input
              value={editorialNote}
              onChange={(e) => setEditorialNote(e.target.value)}
              placeholder="這件事對台灣廠商意味著什麼？（一句話）"
              style={{ ...inputBase, border: "1px solid #2a402a" }}
            />
            <div style={{ fontSize: 11, color: "#4a6a4a", marginTop: 4 }}>這句話會顯示在文章頂端，代表 Pedaling Forward 的觀點。</div>
          </div>

          {/* Meta */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelBase}>受眾</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}
                style={{ ...inputBase, cursor: "pointer" }}>
                {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={labelBase}>原文連結</label>
              <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..." style={inputBase} />
            </div>
          </div>

          {/* Source items */}
          {post.mediaItems?.length ? (
            <div style={{ marginBottom: 20, padding: "10px 14px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: "#5a5650", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>情報來源</div>
              {post.mediaItems.map((m) => (
                <div key={m._id} style={{ fontSize: 12, color: "#8a8278", marginBottom: 2 }}>
                  <a href={m.url} target="_blank" rel="noopener" style={{ color: "#a09890" }}>{m.title}</a>
                  {m.sourceName && <span> · {m.sourceName}</span>}
                </div>
              ))}
            </div>
          ) : null}

          {/* Locale tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #2a2824" }}>
            {LOCALES.map((l) => (
              <button key={l} onClick={() => setActiveLocale(l)}
                style={{ padding: "6px 14px", background: "none", border: "none", borderBottom: activeLocale === l ? "2px solid #D5352A" : "2px solid transparent", color: activeLocale === l ? "#fff" : "#8a8278", cursor: "pointer", fontSize: 12, fontWeight: activeLocale === l ? 600 : 400, marginBottom: -1 }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Per-locale fields */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelBase}>標題</label>
            <input value={title[activeLocale]} onChange={(e) => setTitle((t) => ({ ...t, [activeLocale]: e.target.value }))}
              style={inputBase} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelBase}>摘要（一段）</label>
            <textarea value={excerpt[activeLocale]} onChange={(e) => setExcerpt((ex) => ({ ...ex, [activeLocale]: e.target.value }))}
              rows={4} style={{ ...inputBase, resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a2824", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onDone} style={{ padding: "7px 16px", background: "none", border: "1px solid #2a2824", color: "#8a8278", borderRadius: 4, cursor: "pointer" }}>關閉</button>
          <button onClick={save} disabled={saving}
            style={{ padding: "7px 16px", background: "#1e1c19", border: "1px solid #2a2824", color: "#e8e4df", borderRadius: 4, cursor: "pointer" }}>
            {saving ? "儲存中…" : "儲存草稿"}
          </button>
          <span style={{ flex: 1 }} />
          <button onClick={publish} disabled={publishing || saving}
            style={{ padding: "8px 22px", background: publishing ? "#6a3020" : "#D5352A", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            {publishing ? "發布中…" : "🚀 發布"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComposePage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DraftPost | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/posts?status=draft", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const audienceIcon = (a?: string) => a === "supplier" ? "🏭" : a === "shop" ? "🏪" : "🌐";

  return (
    <div>
      {editing && <EditPane post={editing} token={token} onDone={() => { setEditing(null); load(); }} />}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>草稿</h1>
        <span style={{ fontSize: 13, color: "#5a5650" }}>{posts.length} 篇待發布</span>
        <button onClick={load} style={{ marginLeft: "auto", padding: "6px 14px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          重新整理
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#8a8278", padding: 32, textAlign: "center" }}>載入中…</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#8a8278", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div>目前沒有草稿。去情報室選文章生成摘要吧。</div>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post._id}
              onClick={() => setEditing(post)}
              style={{ padding: "16px 18px", borderBottom: "1px solid #1a1916", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#141210")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#e8e4df" }}>
                    {audienceIcon(post.audience)} {post.title?.zh || post.title?.en || "(無標題)"}
                  </span>
                </div>
                {post.editorialNote && (
                  <div style={{ fontSize: 12, color: "#4caf50", marginBottom: 4, fontStyle: "italic" }}>
                    「{post.editorialNote}」
                  </div>
                )}
                {post.excerpt?.zh && (
                  <div style={{ fontSize: 12, color: "#6a6460", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {post.excerpt.zh}
                  </div>
                )}
                {post.mediaItems?.length ? (
                  <div style={{ fontSize: 11, color: "#5a5650", marginTop: 4 }}>
                    來源：{post.mediaItems.map((m) => m.sourceName || m.title).join("、")}
                  </div>
                ) : null}
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#5a5650" }}>{fmt(post._createdAt)}</div>
                {!post.editorialNote && (
                  <div style={{ fontSize: 11, color: "#D5352A", marginTop: 4 }}>⚠ 缺備注</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
