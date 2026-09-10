"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../layout";

type LocaleKey = "en" | "zh" | "ja" | "de";

type DraftPost = {
  _id: string;
  _createdAt: string;
  publishedAt?: string;
  status: string;
  postType?: string;
  audience?: string;
  editorialNote?: string;
  title?: Record<LocaleKey, string>;
  excerpt?: Record<LocaleKey, string>;
  slug?: { current: string };
  sourceUrl?: string;
  mediaTags?: string[];
  mediaItems?: { _id: string; title: string; url: string; sourceName?: string }[];
};

const LOCALES: LocaleKey[] = ["zh", "en", "ja", "de"];
const AUDIENCE_OPTIONS = [
  { value: "supplier", label: "🏭 供應商（zh）" },
  { value: "shop", label: "🏪 車店（en/de/ja）" },
  { value: "both", label: "🌐 兩者（全語言）" },
];

function isoWeek(d: Date): number {
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - day);
  const y1 = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return Math.ceil(((u.getTime() - y1.getTime()) / 86400000 + 1) / 7);
}

function fmtNewsDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const m = d.toLocaleDateString("zh-TW", { year: "numeric", month: "long" });
  return `${m} · W${isoWeek(d)}`;
}

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
      // 1. Save metadata
      await fetch("/api/admin/posts", {
        method: "PATCH", headers,
        body: JSON.stringify({ id: post._id, action: "update", title, excerpt, editorialNote, audience, sourceUrl }),
      });
      // 2. Assign best-match image from library (falls back to Pixabay if library miss)
      await fetch("/api/admin/assets/assign-to-post", {
        method: "POST", headers,
        body: JSON.stringify({ postId: post._id }),
      });
      // 3. Publish
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
            <label style={{ ...labelBase, color: "#4caf50" }}>編輯觀點</label>
            <textarea
              value={editorialNote}
              onChange={(e) => setEditorialNote(e.target.value)}
              placeholder="這件事對台灣廠商意味著什麼？"
              rows={3}
              style={{ ...inputBase, border: "1px solid #2a402a", resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: "#4a6a4a", marginTop: 4 }}>會顯示在文章頂端，代表 Pedaling Forward 的觀點。</div>
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
  const [activeStatus, setActiveStatus] = useState<"draft" | "published">("draft");
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DraftPost | null>(null);
  const [unpublishing, setUnpublishing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [autoTagging, setAutoTagging] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairingDates, setRepairingDates] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?status=${activeStatus}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, activeStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  async function autoTagPublished() {
    setAutoTagging(true);
    try {
      const res = await fetch("/api/admin/posts/auto-tag", { method: "POST", headers });
      const d = await res.json() as { ok?: boolean; tagged?: number; total?: number; message?: string; errors?: string[]; error?: string };
      if (!res.ok) { showToast(`失敗：${d.error ?? `HTTP ${res.status}`}`); return; }
      if (d.message) { showToast(d.message); return; }
      const errNote = d.errors?.length ? `（${d.errors.length} 批次出錯）` : "";
      showToast(`完成：${d.tagged}/${d.total} 篇文章已自動補標籤${errNote}`);
      load();
    } catch (err) {
      showToast(`失敗：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAutoTagging(false);
    }
  }

  async function repairDates() {
    setRepairingDates(true);
    try {
      const res = await fetch("/api/admin/posts/repair-dates", { method: "POST", headers });
      const text = await res.text();
      let d: { ok?: boolean; repaired?: number; total?: number; error?: string } = {};
      try { d = JSON.parse(text); } catch { /* timeout */ }
      if (!res.ok) { showToast(`失敗：${d.error ?? `HTTP ${res.status}`}`); return; }
      if (!d.ok) { showToast("失敗：伺服器沒有回應，請稍後再試"); return; }
      showToast(`完成：${d.repaired}/${d.total} 篇已補上正確日期`);
      if (d.repaired) load();
    } catch (err) {
      showToast(`失敗：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRepairingDates(false);
    }
  }

  async function repairBodies() {
    setRepairing(true);
    try {
      const res = await fetch("/api/admin/posts/repair-bodies", { method: "POST", headers });
      const text = await res.text();
      let d: { ok?: boolean; repaired?: number; total?: number; details?: string[]; error?: string } = {};
      try { d = JSON.parse(text); } catch { /* non-JSON timeout */ }
      if (!res.ok) { showToast(`失敗：${d.error ?? `HTTP ${res.status}`}`); return; }
      if (!d.ok) { showToast("失敗：伺服器沒有回應，請稍後再試"); return; }
      showToast(`完成：${d.repaired}/${d.total} 篇已修復段落重複`);
      if (d.repaired) load();
    } catch (err) {
      showToast(`失敗：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRepairing(false);
    }
  }

  async function unpublish(id: string) {
    setUnpublishing(id);
    try {
      const res = await fetch("/api/admin/posts", { method: "PATCH", headers, body: JSON.stringify({ id, action: "unpublish" }) });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("↩ 已退回草稿");
      load();
    } catch (err) {
      showToast(`失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUnpublishing(null);
    }
  }

  const audienceIcon = (a?: string) => a === "supplier" ? "🏭" : a === "shop" ? "🏪" : "🌐";

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}
      {editing && <EditPane post={editing} token={token} onDone={() => { setEditing(null); load(); }} />}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>文章管理</h1>
        {activeStatus === "published" && (
          <>
            <button onClick={autoTagPublished} disabled={autoTagging || repairing}
              style={{ padding: "6px 14px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              {autoTagging ? "補標籤中…" : "AI 補標籤（無標籤文章）"}
            </button>
            <button onClick={repairBodies} disabled={repairing || autoTagging || repairingDates}
              style={{ padding: "6px 14px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              {repairing ? "修復中…" : "修復段落重複"}
            </button>
            <button onClick={repairDates} disabled={repairingDates || repairing || autoTagging}
              style={{ padding: "6px 14px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
              {repairingDates ? "修復中…" : "補正文章日期"}
            </button>
          </>
        )}
        <button onClick={load} style={{ marginLeft: "auto", padding: "6px 14px", background: "#1e1c19", border: "1px solid #2a2824", color: "#c8c4c0", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          重新整理
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #2a2824" }}>
        {([
          { key: "draft",     label: "草稿",  color: "#f59e0b" },
          { key: "published", label: "已發布", color: "#4caf50" },
        ] as const).map(({ key, label, color }) => (
          <button key={key} onClick={() => setActiveStatus(key)}
            style={{ padding: "8px 20px", background: "none", border: "none", borderBottom: activeStatus === key ? `2px solid ${color}` : "2px solid transparent", color: activeStatus === key ? color : "#5a5650", cursor: "pointer", fontSize: 13, fontWeight: activeStatus === key ? 600 : 400, marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#8a8278", padding: 32, textAlign: "center" }}>載入中…</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#8a8278", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{activeStatus === "draft" ? "📭" : "📂"}</div>
          <div>{activeStatus === "draft" ? "目前沒有草稿。去情報室選文章生成摘要吧。" : "目前沒有已發布文章。"}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: "#5a5650", padding: "4px 0 12px" }}>{posts.length} 篇{activeStatus === "draft" ? "待發布" : "已發布"}</div>
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
                  {activeStatus === "published" && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", background: "#1e3a1e", color: "#4caf50", borderRadius: 3 }}>
                      已發布
                    </span>
                  )}
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
                {post.mediaTags?.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                    {post.mediaTags.map((t) => (
                      <span key={t} style={{ fontSize: 10, padding: "1px 6px", background: "#1a1c1a", border: "1px solid #2a402a", borderRadius: 3, color: "#6a9a6a" }}>{t}</span>
                    ))}
                  </div>
                ) : activeStatus === "published" ? (
                  <div style={{ fontSize: 11, color: "#D5352A", marginTop: 4 }}>⚠ 無標籤</div>
                ) : null}
                {post.mediaItems?.length ? (
                  <div style={{ fontSize: 11, color: "#5a5650", marginTop: 4 }}>
                    {post.mediaItems.map((m) => m.sourceName || m.title).join(" · ")}
                  </div>
                ) : null}
              </div>
              <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                {post.publishedAt ? (
                  <div style={{ fontSize: 12, color: "#c8c4c0", fontWeight: 600 }}>
                    {fmtNewsDate(post.publishedAt)}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#5a5650" }}>（來源日期未知）</div>
                )}
                <div style={{ fontSize: 10, color: "#5a5650" }}>收錄 {fmt(post._createdAt)}</div>
                {activeStatus === "draft" && !post.editorialNote && (
                  <div style={{ fontSize: 11, color: "#D5352A" }}>⚠ 缺備注</div>
                )}
                {activeStatus === "published" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); unpublish(post._id); }}
                    disabled={unpublishing === post._id}
                    style={{ padding: "3px 10px", background: "#1e1c19", border: "1px solid #3a3530", color: "#8a8278", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                    {unpublishing === post._id ? "處理中…" : "退回草稿"}
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
