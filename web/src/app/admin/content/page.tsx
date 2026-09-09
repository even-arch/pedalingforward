"use client";

import { useState } from "react";
import { useAuth } from "../layout";

type TranslateResult = { ok: boolean; error?: string };

export default function ContentPage() {
  const { token } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [seedingPages, setSeedingPages] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [translating, setTranslating] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function seedPages() {
    setSeedingPages(true);
    try {
      const res = await fetch("/api/admin/seed-pages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const failed = (data.results ?? []).filter((r: { ok: boolean }) => !r.ok);
      if (failed.length) throw new Error(`${failed.length} 個頁面失敗`);
      showToast("✅ 五個靜態頁面已寫入 Sanity");
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeedingPages(false);
    }
  }

  async function seedSettings() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      showToast("✅ 網站文字已寫入（四語）");
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(false);
    }
  }

  async function translateSettings() {
    setTranslating(true);
    try {
      const res = await fetch("/api/admin/translate-settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: TranslateResult = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      showToast("✅ 翻譯完成，已寫入 Sanity");
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTranslating(false);
    }
  }

  const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#9a9490", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 };
  const desc: React.CSSProperties = { fontSize: 13, color: "#8a8278", marginBottom: 16, lineHeight: 1.65 };
  const section: React.CSSProperties = { marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #2a2824" };

  return (
    <div style={{ maxWidth: 640 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <h1 style={{ margin: "0 0 32px", fontSize: 22, fontWeight: 700, color: "#fff" }}>網站內容</h1>

      {/* Static pages */}
      <div style={section}>
        <div style={sectionLabel}>靜態頁面（五頁 × 四語）</div>
        <p style={desc}>
          僅在 Sanity 中尚未建立頁面時才寫入預設內容。已存在的頁面不會被覆蓋——
          在 Studio 裡改過的文字是安全的。
        </p>
        <button
          onClick={seedPages}
          disabled={seedingPages}
          style={{ padding: "10px 24px", background: seedingPages ? "#2a2824" : "#D5352A", border: "none", color: seedingPages ? "#9a9490" : "#fff", borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: seedingPages ? "not-allowed" : "pointer" }}
        >
          {seedingPages ? "寫入中…" : "建立缺少的靜態頁面"}
        </button>
      </div>

      {/* Hero / join content */}
      <div style={section}>
        <div style={sectionLabel}>首頁介紹文字</div>
        <p style={desc}>
          將 Hero 標題、副文字、數字統計、加入區塊等欄位直接寫入 Sanity siteSettings（en / zh / ja / de 四語）。
          之後在 Studio 修改英文版後，可用「AI 翻譯」按鈕重新產出其他語言。
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={seedSettings}
            disabled={seeding}
            style={{ padding: "10px 24px", background: seeding ? "#2a2824" : "#D5352A", border: "none", color: seeding ? "#9a9490" : "#fff", borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: seeding ? "not-allowed" : "pointer" }}
          >
            {seeding ? "寫入中…" : "初始化網站文字"}
          </button>
          <button
            onClick={translateSettings}
            disabled={translating}
            style={{ padding: "10px 24px", background: translating ? "#2a2824" : "#1e1c19", border: "1px solid #3a3630", color: translating ? "#9a9490" : "#e8e4df", borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: translating ? "not-allowed" : "pointer" }}
          >
            {translating ? "翻譯中…" : "AI 重新翻譯（zh / ja / de）"}
          </button>
        </div>
      </div>

      <div style={{ padding: 16, background: "#141210", border: "1px solid #2a2824", borderRadius: 6 }}>
        <div style={{ fontSize: 12, color: "#9a9490", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>注意</div>
        <div style={{ fontSize: 12, color: "#8a8278", lineHeight: 1.8 }}>
          初始化操作使用 <code style={{ color: "#a09890" }}>createIfNotExists</code>，不會覆蓋 Sanity 中已有的內容。若需要強制重置，請先在 Studio 手動刪除對應文件。
        </div>
      </div>
    </div>
  );
}
