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
  callsUsed: number;
  results: IngestResult[] | null;
};
type DbStats = {
  total: number;
  byFlow: { flow: string; _count: { id: number } }[];
  latestPeriod: string | null;
  earliestPeriod: string | null;
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
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/trade-counts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDbStats(await res.json());
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadRuns(); loadStats(); }, [loadRuns, loadStats]);

  // Auto-poll every 5s when any run is "running"
  useEffect(() => {
    const hasRunning = runs.some((r) => r.status === "running");
    if (!hasRunning) return;
    const id = setInterval(() => { loadRuns(); loadStats(); }, 5000);
    return () => clearInterval(id);
  }, [runs, loadRuns, loadStats]);

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
  const statusLabel = (s: string) => s === "done" ? "完成" : s === "error" ? "錯誤" : "執行中 ●";

  return (
    <div style={{ maxWidth: 720 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>貿易資料</h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9a9490" }}>UN Comtrade · HS 8714 / 8712 / 871430 / 871160 · 每月 5 號 02:00 自動執行</p>

      {/* DB 現況：直接查詢資料庫，確認資料真的有存進去 */}
      <div style={{ background: "#141210", border: "1px solid #2a2824", borderRadius: 6, padding: "16px 20px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "#9a9490", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            資料庫現況（直接查詢）
          </span>
          <button
            onClick={loadStats}
            style={{ padding: "2px 8px", background: "transparent", border: "1px solid #3a3630", borderRadius: 3, color: "#9a9490", fontSize: 10, cursor: "pointer" }}
          >
            重新整理
          </button>
        </div>
        {statsLoading ? (
          <span style={{ fontSize: 13, color: "#6a6460" }}>查詢中…</span>
        ) : !dbStats ? (
          <span style={{ fontSize: 13, color: "#f08070" }}>無法取得資料庫狀態</span>
        ) : dbStats.total === 0 ? (
          <span style={{ fontSize: 15, color: "#f08070", fontWeight: 600 }}>⚠ TradeMetric 表格內目前是空的，尚無任何資料</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 32px", alignItems: "baseline" }}>
            <div>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#6aaa70", fontFamily: "monospace" }}>
                {dbStats.total.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: "#9a9490", marginLeft: 6 }}>筆記錄</span>
            </div>
            <div style={{ fontSize: 13, color: "#a09890" }}>
              涵蓋期間：<span style={{ color: "#e8e4df", fontFamily: "monospace" }}>{dbStats.earliestPeriod ?? "—"}</span>
              {" "}→{" "}
              <span style={{ color: "#e8e4df", fontFamily: "monospace" }}>{dbStats.latestPeriod ?? "—"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#9a9490" }}>
              {dbStats.byFlow.map((f) => (
                <span key={f.flow} style={{ marginRight: 12 }}>
                  {f.flow}：<span style={{ color: "#e8e4df" }}>{f._count.id.toLocaleString()}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

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
                style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto auto auto", gap: "0 14px", alignItems: "center", padding: "8px 12px", background: "#141210", borderRadius: 3, cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ fontSize: 10, color: statusColor(run.status), fontWeight: 700, animation: run.status === "running" ? "pulse 1.2s ease-in-out infinite" : undefined }}>{statusLabel(run.status)}</span>
                <span style={{ fontSize: 12, color: "#a09890", fontFamily: "monospace" }}>{fmt(run.startedAt)}</span>
                <span style={{ fontSize: 11, color: "#9a9490" }}>{run.triggeredBy}</span>
                {run.callsUsed > 0 ? (
                  <span style={{ fontSize: 11, color: "#9a9490", fontFamily: "monospace" }}>{run.callsUsed} calls</span>
                ) : <span />}
                <span style={{ fontSize: 12, color: run.totalSaved > 0 ? "#6aaa70" : "#9a9490", textAlign: "right" }}>
                  {run.totalSaved > 0 ? `+${run.totalSaved}` : "—"}
                </span>
                {run.totalErrors > 0 ? (
                  <span style={{ fontSize: 11, color: "#f08070" }}>{run.totalErrors} err</span>
                ) : <span />}
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
