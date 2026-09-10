"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../layout";

type ImageAssetItem = {
  _id: string;
  _createdAt: string;
  title: string;
  quality?: string;
  tags?: string[];
  modelNo?: string;
  source?: string;
  usageRights?: string;
  imageUrl?: string;
  overlap?: number;
};

const QUALITY_OPTS = [
  { value: "raw",      label: "📷 Raw" },
  { value: "edited",   label: "✂️ 修圖" },
  { value: "lifestyle",label: "🏞 Lifestyle" },
];

const RIGHTS_OPTS = [
  { value: "owned",    label: "✅ 自有" },
  { value: "licensed", label: "📝 授權" },
  { value: "editorial",label: "📰 Editorial" },
  { value: "stock",    label: "🛒 Stock" },
];

const TAG_LABELS: Record<string, string> = {
  "supply-chain":   "供應鏈",
  "product-launch": "新品",
  "market-news":    "市場動態",
  "regulation":     "法規",
  "trade-show":     "展覽",
  "retail":         "零售",
  "tech":           "技術",
  "e-bike":         "電動車",
  "urban":          "都市",
  "cargo-bike":     "貨運車",
  "gravel":         "Gravel",
  "mtb":            "MTB",
  "road":           "公路",
  "shimano":        "Shimano",
  "sram":           "SRAM",
  "bosch":          "Bosch",
  "carbon-fiber":   "碳纖維",
  "hydraulic-brakes":"油壓煞車",
  "suspension":     "避震",
};

function tagLabel(t: string) {
  return TAG_LABELS[t] ?? t;
}

function thumbUrl(url?: string) {
  if (!url) return "";
  return `${url}?w=360&h=240&fit=crop&auto=format&q=80`;
}

// ──────────────────────────────────────────────
// Upload Modal
// ──────────────────────────────────────────────
function UploadModal({ token, onDone, onClose }: {
  token: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [quality, setQuality] = useState("raw");
  const [tagsInput, setTagsInput] = useState("");
  const [source, setSource] = useState("");
  const [usageRights, setUsageRights] = useState("owned");
  const [modelNo, setModelNo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function pickFile(f: File) {
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const tags = tagsInput.split(/[\s,]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
      const meta = { title, quality, tags, source, usageRights, modelNo };
      const fd = new FormData();
      fd.append("image", file);
      fd.append("meta", JSON.stringify(meta));
      const res = await fetch("/api/admin/assets/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={OVERLAY}>
      <div style={{ ...PANEL, maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={PANEL_HEADER}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>上傳圖片</span>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>
        <form onSubmit={submit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Drop zone */}
          <label
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "2px dashed #3a3834", borderRadius: 8, padding: 24, cursor: "pointer",
              background: file ? "#1a1916" : "#0f0e0c", minHeight: 120, textAlign: "center",
              position: "relative", overflow: "hidden",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
          >
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain", borderRadius: 4 }} />
            ) : (
              <span style={{ color: "#8a8278", fontSize: 13 }}>拖曳圖片到這裡，或點擊選擇</span>
            )}
          </label>

          <Field label="標題">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={INPUT} required />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="品質">
              <select value={quality} onChange={(e) => setQuality(e.target.value)} style={INPUT}>
                {QUALITY_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="版權">
              <select value={usageRights} onChange={(e) => setUsageRights(e.target.value)} style={INPUT}>
                {RIGHTS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="標籤（空格或逗號分隔）">
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} style={INPUT}
              placeholder="shimano supply-chain product-launch" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="來源">
              <input value={source} onChange={(e) => setSource(e.target.value)} style={INPUT}
                placeholder="supplier / Taipei Cycle 2025 / ..." />
            </Field>
            <Field label="型號">
              <input value={modelNo} onChange={(e) => setModelNo(e.target.value)} style={INPUT}
                placeholder="RD-R9200" />
            </Field>
          </div>

          {error && <div style={{ color: "#D5352A", fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={!file || uploading} style={BTN_RED}>
            {uploading ? "上傳中…" : "儲存到圖庫"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Edit Tags Modal
// ──────────────────────────────────────────────
function EditModal({ item, token, onDone, onClose }: {
  item: ImageAssetItem;
  token: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [quality, setQuality] = useState(item.quality ?? "raw");
  const [tagsInput, setTagsInput] = useState((item.tags ?? []).join(" "));
  const [source, setSource] = useState(item.source ?? "");
  const [usageRights, setUsageRights] = useState(item.usageRights ?? "owned");
  const [modelNo, setModelNo] = useState(item.modelNo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const tags = tagsInput.split(/[\s,]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
      const res = await fetch("/api/admin/assets", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, title, quality, tags, source, usageRights, modelNo }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={OVERLAY}>
      <div style={{ ...PANEL, maxWidth: 480 }}>
        <div style={PANEL_HEADER}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>編輯圖片資訊</span>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>
        <form onSubmit={save} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl(item.imageUrl)} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 4, background: "#1a1916" }} />
          )}
          <Field label="標題">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={INPUT} required />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="品質">
              <select value={quality} onChange={(e) => setQuality(e.target.value)} style={INPUT}>
                {QUALITY_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="版權">
              <select value={usageRights} onChange={(e) => setUsageRights(e.target.value)} style={INPUT}>
                {RIGHTS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="標籤（空格或逗號分隔）">
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} style={INPUT} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="來源">
              <input value={source} onChange={(e) => setSource(e.target.value)} style={INPUT} />
            </Field>
            <Field label="型號">
              <input value={modelNo} onChange={(e) => setModelNo(e.target.value)} style={INPUT} />
            </Field>
          </div>
          {error && <div style={{ color: "#D5352A", fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={saving} style={BTN_RED}>
            {saving ? "儲存中…" : "儲存"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Match Panel — find images for given post tags
// ──────────────────────────────────────────────
function MatchPanel({ token, onClose }: { token: string; onClose: () => void }) {
  const [tagsInput, setTagsInput] = useState("");
  const [results, setResults] = useState<ImageAssetItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput.split(/[\s,]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (!tags.length) return;
    setSearching(true);
    try {
      const res = await fetch("/api/admin/assets/match", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      const data = await res.json() as { items: ImageAssetItem[] };
      setResults(data.items ?? []);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div style={OVERLAY}>
      <div style={{ ...PANEL, maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={PANEL_HEADER}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>為文章找配圖</span>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p style={{ color: "#8a8278", fontSize: 13, margin: "0 0 16px" }}>
            貼上文章的標籤，系統按標籤重疊數排出最適合的圖片。
          </p>
          <form onSubmit={search} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="shimano supply-chain product-launch …"
              style={{ ...INPUT, flex: 1 }}
            />
            <button type="submit" disabled={searching || !tagsInput.trim()} style={BTN_RED}>
              {searching ? "…" : "搜尋"}
            </button>
          </form>
          {searched && results.length === 0 && (
            <div style={{ color: "#8a8278", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
              目前圖庫裡沒有符合這些標籤的圖片
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {results.map((img) => (
              <div key={img._id} style={CARD}>
                {img.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbUrl(img.imageUrl)} alt={img.title} style={THUMB} />
                ) : (
                  <div style={{ ...THUMB, background: "#1a1916", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a3834" }}>
                    無圖
                  </div>
                )}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#e8e4df", lineHeight: 1.3 }}>{img.title}</div>
                  <div style={{ fontSize: 11, color: "#D5352A", fontWeight: 700, marginBottom: 4 }}>
                    符合 {img.overlap ?? 0} 個標籤
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {(img.tags ?? []).slice(0, 5).map((t) => (
                      <span key={t} style={TAG_CHIP}>{tagLabel(t)}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Image Card
// ──────────────────────────────────────────────
function ImageCard({ item, onEdit, onDelete }: {
  item: ImageAssetItem;
  onEdit: (item: ImageAssetItem) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const qualityColor = item.quality === "lifestyle" ? "#4caf50" : item.quality === "edited" ? "#f59e0b" : "#8a8278";
  const qualityLabel = QUALITY_OPTS.find((o) => o.value === item.quality)?.label ?? item.quality ?? "—";

  return (
    <div style={CARD}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl(item.imageUrl)} alt={item.title} style={THUMB} />
      ) : (
        <div style={{ ...THUMB, background: "#1a1916", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a3834", fontSize: 13 }}>
          無圖
        </div>
      )}
      <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e4df", lineHeight: 1.3, marginBottom: 6 }}>{item.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: qualityColor, background: `${qualityColor}22`, padding: "1px 6px", borderRadius: 3 }}>
            {qualityLabel}
          </span>
          {item.usageRights && (
            <span style={{ fontSize: 10, color: "#8a8278" }}>
              {RIGHTS_OPTS.find((o) => o.value === item.usageRights)?.label ?? item.usageRights}
            </span>
          )}
        </div>
        {(item.tags ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
            {(item.tags ?? []).map((t) => (
              <span key={t} style={TAG_CHIP}>{tagLabel(t)}</span>
            ))}
          </div>
        )}
        {item.modelNo && <div style={{ fontSize: 11, color: "#8a8278", marginBottom: 4 }}>#{item.modelNo}</div>}
        {item.source && <div style={{ fontSize: 11, color: "#8a8278", fontStyle: "italic", marginBottom: 4 }}>{item.source}</div>}

        <div style={{ marginTop: "auto", display: "flex", gap: 6, paddingTop: 6 }}>
          <button onClick={() => onEdit(item)} style={BTN_GHOST}>編輯</button>
          {confirmDelete ? (
            <>
              <button onClick={() => onDelete(item._id)} style={{ ...BTN_GHOST, color: "#D5352A", borderColor: "#D5352A" }}>確認刪除</button>
              <button onClick={() => setConfirmDelete(false)} style={BTN_GHOST}>取消</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={BTN_GHOST}>刪除</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
export default function AssetsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ImageAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuality, setFilterQuality] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [showUpload, setShowUpload] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [editItem, setEditItem] = useState<ImageAssetItem | null>(null);
  const [populating, setPopulating] = useState(false);
  const [populateResult, setPopulateResult] = useState<string | null>(null);
  const [populateProgress, setPopulateProgress] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [backfillProgress, setBackfillProgress] = useState<string | null>(null);
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterQuality) params.set("quality", filterQuality);
      if (filterTag) params.set("tag", filterTag);
      const res = await fetch(`/api/admin/assets?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as { items: ImageAssetItem[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, filterQuality, filterTag]);

  useEffect(() => { load(); }, [load]);

  async function populate() {
    setPopulating(true);
    setPopulateResult(null);
    setPopulateProgress(null);

    try {
      // Step 1: get tag list and current counts
      const listRes = await fetch("/api/admin/assets/populate", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listRes.ok) {
        const d = await listRes.json() as { error?: string };
        setPopulateResult(`失敗：${d.error ?? `HTTP ${listRes.status}`}`);
        return;
      }
      const { tags } = await listRes.json() as {
        tags: { tag: string; count: number; needed: number }[];
        imagesPerTag: number;
      };

      // searchQuery lookup (mirrors server-side POPULATE_TAGS)
      const SEARCH_QUERIES: Record<string, string> = {
        "supply-chain": "bicycle supply chain", "product-launch": "bicycle new product component",
        "market-news": "bicycle industry market", "trade-show": "bicycle trade show exhibition",
        "retail": "bicycle shop retail", "regulation": "bicycle transport regulation",
        "tech": "bicycle technology innovation", "e-bike": "bicycle electric ebike",
        "urban": "bicycle urban city commute", "cargo-bike": "bicycle cargo utility",
        "gravel": "bicycle gravel adventure", "mtb": "bicycle mountain trail", "road": "bicycle road racing",
        "shimano": "bicycle shimano component", "sram": "bicycle sram drivetrain",
        "bosch": "bicycle bosch ebike motor", "trek": "bicycle trek", "giant": "bicycle giant",
        "specialized": "bicycle specialized", "merida": "bicycle merida",
        "carbon-fiber": "bicycle carbon fiber frame", "hydraulic-brakes": "bicycle disc brake hydraulic",
        "suspension": "bicycle suspension fork", "derailleur": "bicycle derailleur gear", "frame": "bicycle frame",
      };

      const toFetch = tags.filter((t) => t.needed > 0);
      if (!toFetch.length) {
        setPopulateResult("圖庫已完整，所有標籤都有足夠的圖片");
        return;
      }

      // Step 2: process tags one by one (each request ≈ 10-15s, avoids Vercel timeout)
      let totalAdded = 0;
      let totalSkipped = 0;
      for (let i = 0; i < toFetch.length; i++) {
        const { tag } = toFetch[i];
        const searchQuery = SEARCH_QUERIES[tag] ?? `${tag} bicycle`;
        setPopulateProgress(`處理中 ${i + 1}/${toFetch.length}：${tag}`);

        const tagRes = await fetch("/api/admin/assets/populate", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ tag, searchQuery }),
        });
        const d = await tagRes.json() as { ok?: boolean; added?: number; skipped?: boolean; error?: string };
        if (!tagRes.ok) {
          setPopulateResult(`標籤「${tag}」失敗：${d.error ?? `HTTP ${tagRes.status}`}`);
          return;
        }
        if (d.skipped) totalSkipped++;
        else totalAdded += d.added ?? 0;
      }

      setPopulateProgress(null);
      setPopulateResult(`完成：新增 ${totalAdded} 張圖片，${totalSkipped} 個標籤已有足夠圖片`);
      load();
    } catch (err) {
      setPopulateResult(`填充失敗：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPopulating(false);
      setPopulateProgress(null);
    }
  }

  async function backfill() {
    setBackfilling(true);
    setBackfillResult(null);
    setBackfillProgress("查詢沒有配圖的已發布文章…");

    try {
      const listRes = await fetch("/api/admin/assets/backfill", { headers });
      if (!listRes.ok) {
        const d = await listRes.json() as { error?: string };
        setBackfillResult(`失敗：${d.error ?? `HTTP ${listRes.status}`}`);
        return;
      }
      const { posts } = await listRes.json() as { posts: { _id: string; title?: string; slug?: string }[]; count: number };

      if (!posts.length) {
        setBackfillResult("所有已發布文章都已有配圖");
        return;
      }

      let assigned = 0;
      let skipped = 0;
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        setBackfillProgress(`配圖中 ${i + 1}/${posts.length}：${post.title ?? post.slug ?? post._id}`);

        const res = await fetch("/api/admin/assets/assign-to-post", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post._id }),
        });
        const d = await res.json() as { ok?: boolean; source?: string };
        if (d.ok && d.source !== "no-tags") assigned++;
        else skipped++;
      }

      setBackfillProgress(null);
      setBackfillResult(`完成：${assigned} 篇文章已配圖，${skipped} 篇跳過（無標籤或已有圖）`);
    } catch (err) {
      setBackfillResult(`補配失敗：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBackfilling(false);
      setBackfillProgress(null);
    }
  }

  async function deleteItem(id: string) {
    await fetch("/api/admin/assets", {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  // Collect all distinct tags from current items for the tag filter chips
  const allTags = Array.from(new Set(items.flatMap((it) => it.tags ?? []))).sort();

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#e8e4df" }}>圖庫管理</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8a8278" }}>
            {items.length} 張圖片 · 用標籤為每篇文章找合適的配圖
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowMatch(true)} style={BTN_GHOST}>為文章找配圖…</button>
          <button onClick={backfill} disabled={backfilling || populating} style={BTN_GHOST}>
            {backfilling ? "補配中…" : "補配已發布文章"}
          </button>
          <button onClick={populate} disabled={populating || backfilling} style={BTN_GHOST}>
            {populating ? "填充中（約 30 秒）…" : "自動填充圖庫"}
          </button>
          <button onClick={() => setShowUpload(true)} style={BTN_RED}>＋ 上傳圖片</button>
        </div>
      </div>
      {(backfillProgress || backfillResult) && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "#1a1c1a", border: "1px solid #2a402a", borderRadius: 6, fontSize: 13, color: backfillResult?.startsWith("失敗") || backfillResult?.startsWith("補配失敗") ? "#D5352A" : "#4caf50" }}>
          {backfillProgress ?? backfillResult}
        </div>
      )}
      {(populateProgress || populateResult) && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#1a1c1a", border: "1px solid #2a402a", borderRadius: 6, fontSize: 13, color: populateResult?.startsWith("失敗") || populateResult?.startsWith("填充失敗") ? "#D5352A" : "#4caf50" }}>
          {populateProgress ?? populateResult}
        </div>
      )}

      {/* Quality filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          onClick={() => setFilterQuality("")}
          style={filterQuality === "" ? PILL_ON : PILL_OFF}
        >
          全部
        </button>
        {QUALITY_OPTS.map((o) => (
          <button
            key={o.value}
            onClick={() => setFilterQuality(filterQuality === o.value ? "" : o.value)}
            style={filterQuality === o.value ? PILL_ON : PILL_OFF}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#8a8278", textTransform: "uppercase", letterSpacing: "0.08em" }}>按標籤篩選</span>
            {filterTag && (
              <button onClick={() => setFilterTag("")} style={{ ...BTN_GHOST, padding: "2px 8px", fontSize: 11 }}>清除</button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setFilterTag(filterTag === t ? "" : t)}
                style={filterTag === t ? PILL_ON : PILL_OFF}
              >
                {tagLabel(t)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ color: "#8a8278", textAlign: "center", padding: "60px 0" }}>載入中…</div>
      ) : items.length === 0 ? (
        <div style={{ color: "#8a8278", textAlign: "center", padding: "60px 0" }}>
          {filterQuality || filterTag ? "沒有符合條件的圖片" : "圖庫是空的，點「上傳圖片」開始建立"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {items.map((item) => (
            <ImageCard
              key={item._id}
              item={item}
              onEdit={setEditItem}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal
          token={token}
          onDone={() => { setShowUpload(false); load(); }}
          onClose={() => setShowUpload(false)}
        />
      )}
      {editItem && (
        <EditModal
          item={editItem}
          token={token}
          onDone={() => { setEditItem(null); load(); }}
          onClose={() => setEditItem(null)}
        />
      )}
      {showMatch && (
        <MatchPanel token={token} onClose={() => setShowMatch(false)} />
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// Shared micro-components
// ──────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#8a8278", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      {children}
    </label>
  );
}

// ──────────────────────────────────────────────
// Shared styles
// ──────────────────────────────────────────────
const OVERLAY: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};

const PANEL: React.CSSProperties = {
  background: "#141210", border: "1px solid #2a2824", borderRadius: 8, width: "100%",
};

const PANEL_HEADER: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "14px 24px", borderBottom: "1px solid #2a2824",
};

const CLOSE_BTN: React.CSSProperties = {
  background: "none", border: "none", color: "#8a8278", cursor: "pointer", fontSize: 16, padding: 4,
};

const INPUT: React.CSSProperties = {
  background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4,
  color: "#e8e4df", padding: "8px 10px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
};

const BTN_RED: React.CSSProperties = {
  background: "#D5352A", color: "#fff", border: "none", borderRadius: 4,
  padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};

const BTN_GHOST: React.CSSProperties = {
  background: "none", border: "1px solid #2a2824", borderRadius: 4,
  color: "#8a8278", padding: "6px 12px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
};

const CARD: React.CSSProperties = {
  background: "#141210", border: "1px solid #2a2824", borderRadius: 6,
  display: "flex", flexDirection: "column", overflow: "hidden",
};

const THUMB: React.CSSProperties = {
  width: "100%", height: 150, objectFit: "cover", display: "block",
};

const TAG_CHIP: React.CSSProperties = {
  background: "#1e1c1a", border: "1px solid #2a2824", borderRadius: 3,
  color: "#8a8278", fontSize: 10, padding: "1px 5px",
};

const PILL_ON: React.CSSProperties = {
  background: "#D5352A", color: "#fff", border: "1px solid #D5352A", borderRadius: 4,
  padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
};

const PILL_OFF: React.CSSProperties = {
  background: "none", color: "#8a8278", border: "1px solid #2a2824", borderRadius: 4,
  padding: "5px 12px", fontSize: 12, cursor: "pointer",
};
