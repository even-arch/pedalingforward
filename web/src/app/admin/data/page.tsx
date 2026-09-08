"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../layout";

type IngestResult = { task: string; saved: number; latestPeriod?: string; error?: string };
type IngestRun = {
  id: string;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  totalSaved: number;
  totalErrors: number;
  results: IngestResult[] | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function dur(start: string, end: string | null) {
  if (!end) return "—";
  const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`;
}

export default function DataPage() {
  const { token } = useAuth();
  const [ingesting, setIngesting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/admin/ingest-runs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setRuns(data.runs ?? []);
    }
  }, [token]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  async function runIngest() {
    setIngesting(true);
    try {
      const res = await fetch("/api/admin/ingest-trade", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      showToast(data.background ? "✅ 已在背景啟動，可以離開此頁面" : `✅ 完成，共存入 ${data.totalSaved} 筆`);
      setTimeout(loadRuns, 2000);
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIngesting(false);
    }
  }

  const statusColor = (s: string) => s === "done" ? "#6aaa70" : s === "error" ? "#f08070" : "#e8c84a";
  const statusLabel = (s: string) => s === "done" ? "完成" : s === "error" ? "錯誤" : "執行中";

  return (
    <div style={{ maxWidth: 720 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>貿易資料</h1>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: "#9a9490" }}>UN Comtrade · HS 8714 / 8712 / 871430 / 871160 · 每月 5 號 02:00 自動執行</p>

      <button
        onClick={runIngest}
        disabled={ingesting}
        style={{ padding: "11px 28px", background: ingesting ? "#2a2824" : "#1e1c19", border: "1px solid #3a3630", color: ingesting ? "#9a9490" : "#e8e4df", borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: ingesting ? "not-allowed" : "pointer", marginBottom: 36 }}
      >
        {ingesting ? "啟動中…" : "立即從 Comtrade 更新"}
      </button>

      {/* Run history */}
      <div style={{ fontSize: 11, color: "#9a9490", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        執行歷史（最近 20 次）
        <button onClick={loadRuns} style={{ marginLeft: 12, padding: "2px 8px", background: "transparent", border: "1px solid #3a3630", borderRadius: 3, color: "#9a9490", fontSize: 10, cursor: "pointer" }}>重新整理</button>
      </div>

      {runs.length === 0 ? (
        <div style={{ color: "#6a6460", fontSize: 13 }}>尚無執行記錄</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {runs.map((run) => (
            <div key={run.id}>
              <div
                onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto auto", gap: "0 16px", alignItems: "center", padding: "8px 12px", background: "#141210", borderRadius: 3, cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ fontSize: 10, color: statusColor(run.status), fontWeight: 700 }}>{statusLabel(run.status)}</span>
                <span style={{ fontSize: 12, color: "#a09890", fontFamily: "monospace" }}>{fmt(run.startedAt)}</span>
                <span style={{ fontSize: 11, color: "#9a9490" }}>{run.triggeredBy}</span>
                <span style={{ fontSize: 12, color: run.totalSaved > 0 ? "#6aaa70" : "#9a9490", textAlign: "right" }}>
                  {run.totalSaved > 0 ? `+${run.totalSaved}` : "—"}
                </span>
                {run.totalErrors > 0 && (
                  <span style={{ fontSize: 11, color: "#f08070" }}>{run.totalErrors} err</span>
                )}
                <span style={{ fontSize: 11, color: "#6a6460" }}>{dur(run.startedAt, run.finishedAt)}</span>
              </div>

              {expanded === run.id && run.results && (
                <div style={{ background: "#0e0c0a", borderTop: "1px solid #1e1c19", padding: "10px 12px", marginBottom: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "3px 16px", fontSize: 11 }}>
                    {run.results.filter((r) => r.saved > 0 || r.error).map((r, i) => (
                      <>
                        <span key={`${i}-t`} style={{ color: "#a09890", fontFamily: "monospace" }}>{r.task}</span>
                        <span key={`${i}-s`} style={{ color: r.saved > 0 ? "#6aaa70" : "#9a9490", textAlign: "right" }}>{r.saved > 0 ? `+${r.saved}` : "—"}</span>
                        <span key={`${i}-p`} style={{ color: "#9a9490" }}>{r.latestPeriod ?? ""}</span>
                        <span key={`${i}-e`} style={{ color: "#9a5040" }}>{r.error ?? ""}</span>
                      </>
                    ))}
                    {run.results.every((r) => r.saved === 0 && !r.error) && (
                      <span style={{ color: "#9a9490", gridColumn: "1/-1" }}>全部已是最新，沒有新資料</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
