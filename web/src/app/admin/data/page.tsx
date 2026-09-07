"use client";

import { useState } from "react";
import { useAuth } from "../layout";

type IngestResult = { task: string; saved: number; error?: string };

export default function DataPage() {
  const { token } = useAuth();
  const [ingesting, setIngesting] = useState(false);
  const [results, setResults] = useState<IngestResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function runIngest() {
    setIngesting(true);
    setResults(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/ingest-trade", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResults(data.results ?? []);
      showToast(`✅ 更新完成，共存入 ${data.totalSaved} 筆`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      showToast("❌ 更新失敗");
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#fff" }}>貿易資料</h1>
      <p style={{ margin: "0 0 32px", fontSize: 13, color: "#5a5650" }}>UN Comtrade · HS 8714 / 8712 / 871430</p>

      <p style={{ fontSize: 13, color: "#8a8278", marginBottom: 24, lineHeight: 1.65 }}>
        從 UN Comtrade 補抓最新月份資料，涵蓋進口市場、出口國、雙邊來源三個面向。
        每月 5 號 02:00 自動執行，也可從這裡手動觸發。
      </p>

      <button
        onClick={runIngest}
        disabled={ingesting}
        style={{ padding: "11px 28px", background: ingesting ? "#2a2824" : "#1e1c19", border: "1px solid #3a3630", color: ingesting ? "#5a5650" : "#e8e4df", borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: ingesting ? "not-allowed" : "pointer" }}
      >
        {ingesting ? "更新中…（可能需要數分鐘）" : "立即從 Comtrade 更新"}
      </button>

      {error && (
        <div style={{ marginTop: 20, padding: "10px 14px", background: "#2a1410", border: "1px solid #6a2820", borderRadius: 4, color: "#f08070", fontSize: 12 }}>
          {error}
        </div>
      )}

      {results && (
        <div style={{ marginTop: 24, padding: "16px", background: "#141210", border: "1px solid #2a2824", borderRadius: 4 }}>
          <div style={{ fontSize: 11, color: "#5a5650", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            更新結果
          </div>
          {results.every((r) => r.saved === 0 && !r.error) ? (
            <div style={{ color: "#5a5650", fontSize: 13 }}>全部都是最新的，沒有新資料。</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "4px 16px", fontSize: 12 }}>
              {results.filter((r) => r.saved > 0 || r.error).map((r) => (
                <>
                  <span key={`${r.task}-t`} style={{ color: "#a09890", fontFamily: "monospace" }}>{r.task}</span>
                  <span key={`${r.task}-s`} style={{ color: r.saved > 0 ? "#6aaa70" : "#5a5650", textAlign: "right" }}>
                    {r.saved > 0 ? `+${r.saved}` : "—"}
                  </span>
                  <span key={`${r.task}-e`} style={{ color: "#9a5040", fontSize: 11 }}>{r.error ?? ""}</span>
                </>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
