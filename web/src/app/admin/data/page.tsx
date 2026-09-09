"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../layout";

type IngestResult = { task: string; saved: number; latestPeriod?: string; error?: string };
type IngestRun = {
  id: string; triggeredBy: string; startedAt: string; finishedAt: string | null;
  status: string; totalSaved: number; totalErrors: number; callsUsed: number;
  results: IngestResult[] | null;
};
type DbStats = {
  trade:  { total: number; byFlow: { flow: string; _count: { id: number } }[]; latestPeriod?: string; earliestPeriod?: string };
  events: { total: number; latestDate?: string; lastIngestAt?: string | null };
  rules:  { total: number; verified: number; lastGeneratedAt?: string | null };
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function dur(start: string, end: string | null) {
  if (!end) return "—";
  const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`;
}

function StatCard({ label, value, sub, color = "#6aaa70" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "monospace" }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: "#9a9490" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#6a6460", fontFamily: "monospace" }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub, lastAt, hasData }: { title: string; sub: string; lastAt?: string | null; hasData?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: "#e8e4df" }}>{title}</h2>
        {lastAt ? (
          <span style={{ fontSize: 11, color: "#6aaa70", fontFamily: "monospace" }}>
            最後抓取：{new Date(lastAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : hasData ? (
          <span style={{ fontSize: 11, color: "#9a9490", fontFamily: "monospace" }}>時間未記錄（舊版資料）</span>
        ) : (
          <span style={{ fontSize: 11, color: "#e8c84a", fontFamily: "monospace" }}>尚未執行</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#9a9490" }}>{sub}</p>
    </div>
  );
}

export default function DataPage() {
  const { token } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [tradeLoading, setTradeLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  function showToast(msg: string, ms = 4000) { setToast(msg); setTimeout(() => setToast(null), ms); }

  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/admin/ingest-runs", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setRuns((await res.json()).runs ?? []);
  }, [token]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/trade-counts", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDbStats(await res.json());
    } finally { setStatsLoading(false); }
  }, [token]);

  useEffect(() => { loadRuns(); loadStats(); }, [loadRuns, loadStats]);

  // Auto-poll every 5s when any trade run is "running"
  useEffect(() => {
    if (!runs.some((r) => r.status === "running")) return;
    const id = setInterval(() => { loadRuns(); loadStats(); }, 5000);
    return () => clearInterval(id);
  }, [runs, loadRuns, loadStats]);

  async function runTradeIngest() {
    setTradeLoading(true);
    try {
      const res = await fetch("/api/admin/ingest-trade", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      showToast(data.background ? "✅ Comtrade 更新已在背景啟動" : `✅ 完成，共存入 ${data.totalSaved} 筆`);
      setTimeout(loadRuns, 2000);
    } catch (err) { showToast(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally { setTradeLoading(false); }
  }

  async function runEventsIngest(mode: "recent" | "backfill" | "retag" = "recent") {
    setEventsLoading(true);
    try {
      const body = mode === "backfill" ? { backfill: true } : mode === "retag" ? { retag: true } : {};
      const res = await fetch("/api/admin/ingest-events", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      if (mode === "retag") {
        showToast(`✅ ${data.message}`);
        setTimeout(loadStats, 1000);
      } else {
        showToast(mode === "backfill" ? "✅ GDELT 回溯更新已啟動（2019→now）" : "✅ GDELT 最近 90 天事件已啟動");
        setTimeout(loadStats, 8000);
      }
    } catch (err) { showToast(`❌ ${err instanceof Error ? err.message : String(err)}`, 8000);
    } finally { setEventsLoading(false); }
  }

  async function runRuleGen() {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const res = await fetch("/api/admin/generate-rules", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      showToast(`✅ AI 生成 ${data.generated} 條因果規則`);
      setTimeout(loadStats, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRulesError(msg);
      showToast(`❌ ${msg}`, 8000);
    } finally { setRulesLoading(false); }
  }

  const statusColor = (s: string) => s === "done" ? "#6aaa70" : s === "error" ? "#f08070" : "#e8c84a";
  const statusLabel = (s: string) => s === "done" ? "完成" : s === "error" ? "錯誤" : "執行中 ●";

  const cardStyle = { background: "#141210", border: "1px solid #2a2824", borderRadius: 6, padding: "20px 24px", marginBottom: 20 };
  const btnStyle = (loading: boolean, variant: "primary" | "ghost" = "primary") => ({
    padding: "9px 20px", fontWeight: 600, fontSize: 13, borderRadius: 4, cursor: loading ? "not-allowed" : "pointer",
    ...(variant === "primary"
      ? { background: loading ? "#2a2824" : "#1e1c19", border: "1px solid #3a3630", color: loading ? "#9a9490" : "#e8e4df" }
      : { background: "transparent", border: "1px solid #3a3630", color: "#9a9490" }),
  });

  return (
    <div style={{ maxWidth: 760 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#fff" }}>資料管理</h1>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: "#9a9490" }}>三個資料來源：UN Comtrade 貿易量、GDELT 產業事件、AI 因果規則</p>

      {/* ── Overview summary ── */}
      <div style={{ ...cardStyle, display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9a9490", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>資料庫現況</span>
          <button onClick={() => { loadStats(); loadRuns(); }} style={{ padding: "2px 8px", background: "transparent", border: "1px solid #3a3630", borderRadius: 3, color: "#9a9490", fontSize: 10, cursor: "pointer" }}>↻</button>
        </div>
        {statsLoading ? (
          <span style={{ fontSize: 13, color: "#6a6460" }}>查詢中…</span>
        ) : !dbStats ? (
          <span style={{ fontSize: 13, color: "#f08070" }}>無法取得資料庫狀態</span>
        ) : (
          <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            <StatCard
              label="貿易量記錄"
              value={dbStats.trade.total}
              sub={dbStats.trade.earliestPeriod && dbStats.trade.latestPeriod ? `${dbStats.trade.earliestPeriod} → ${dbStats.trade.latestPeriod}` : undefined}
              color={dbStats.trade.total > 0 ? "#6aaa70" : "#f08070"}
            />
            <StatCard
              label="產業事件"
              value={dbStats.events.total}
              sub={dbStats.events.latestDate ? `最新：${new Date(dbStats.events.latestDate).toLocaleDateString("zh-TW")}` : undefined}
              color={dbStats.events.total > 0 ? "#6aaa70" : "#e8c84a"}
            />
            <StatCard
              label="因果規則"
              value={dbStats.rules.total}
              sub={dbStats.rules.verified > 0 ? `${dbStats.rules.verified} 已驗證` : "尚未驗證"}
              color={dbStats.rules.total > 0 ? "#6aaa70" : "#e8c84a"}
            />
          </div>
        )}
      </div>

      {/* ── 1. UN Comtrade ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="① UN Comtrade 貿易量"
          sub="HS 8714 / 8712 / 871430 / 871160 · 每天 02:00 自動執行"
          lastAt={runs.find((r) => r.status === "done")?.finishedAt ?? null}
        />
        <button onClick={runTradeIngest} disabled={tradeLoading} style={btnStyle(tradeLoading)}>
          {tradeLoading ? "啟動中…" : "立即從 Comtrade 更新"}
        </button>

        {/* Run history */}
        <div style={{ fontSize: 11, color: "#9a9490", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 20, marginBottom: 10 }}>
          執行歷史（最近 20 次）
        </div>
        {runs.length === 0 ? (
          <div style={{ color: "#6a6460", fontSize: 13 }}>尚無執行記錄</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {runs.map((run) => (
              <div key={run.id}>
                <div
                  onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                  style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto auto auto", gap: "0 12px", alignItems: "center", padding: "7px 10px", background: "#0e0c0a", borderRadius: 3, cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ fontSize: 10, color: statusColor(run.status), fontWeight: 700, animation: run.status === "running" ? "pulse 1.2s ease-in-out infinite" : undefined }}>{statusLabel(run.status)}</span>
                  <span style={{ fontSize: 11, color: "#a09890", fontFamily: "monospace" }}>{fmt(run.startedAt)}</span>
                  <span style={{ fontSize: 11, color: "#9a9490" }}>{run.triggeredBy}</span>
                  {run.callsUsed > 0 ? <span style={{ fontSize: 10, color: "#9a9490", fontFamily: "monospace" }}>{run.callsUsed} calls</span> : <span />}
                  <span style={{ fontSize: 11, color: run.totalSaved > 0 ? "#6aaa70" : "#9a9490", textAlign: "right" }}>{run.totalSaved > 0 ? `+${run.totalSaved}` : "—"}</span>
                  {run.totalErrors > 0 ? <span style={{ fontSize: 10, color: "#f08070" }}>{run.totalErrors} err</span> : <span />}
                  <span style={{ fontSize: 10, color: "#6a6460" }}>{dur(run.startedAt, run.finishedAt)}</span>
                </div>
                {expanded === run.id && run.results && (
                  <div style={{ background: "#080604", borderTop: "1px solid #1e1c19", padding: "8px 10px", marginBottom: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "2px 12px", fontSize: 10 }}>
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

      {/* ── 2. GDELT Events ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="② GDELT 全球產業事件"
          sub="自動搜尋自行車貿易相關新聞 · 5 種查詢關鍵字 · 免費公開 API"
          lastAt={dbStats?.events.lastIngestAt}
          hasData={(dbStats?.events.total ?? 0) > 0}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => runEventsIngest("recent")} disabled={eventsLoading} style={btnStyle(eventsLoading)}>
            {eventsLoading ? "更新中…" : "更新最近 90 天"}
          </button>
          <button onClick={() => runEventsIngest("backfill")} disabled={eventsLoading} style={btnStyle(eventsLoading, "ghost")}>
            回溯補齊（2019→now）
          </button>
          <button onClick={() => runEventsIngest("retag")} disabled={eventsLoading} style={btnStyle(eventsLoading, "ghost")}>
            修復國家標籤
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "#6a6460", lineHeight: 1.6 }}>
          查詢範圍：bicycle tariff · supply chain · demand · Taiwan export · ebike regulation<br />
          資料存入 GlobalEvent 表，去重機制以 URL 為依據。<br />
          「修復國家標籤」：從現有事件標題重新推斷提及的國家（修正舊資料只記錄發布國的問題）。
        </div>
      </div>

      {/* ── 3. AI Causal Rules ── */}
      <div style={cardStyle}>
        <SectionHeader
          title="③ AI 因果規則分析"
          sub="讀取 Comtrade + GDELT 資料，用 Claude Haiku 生成因果規則"
          lastAt={dbStats?.rules.lastGeneratedAt}
          hasData={(dbStats?.rules.total ?? 0) > 0}
        />
        <button onClick={runRuleGen} disabled={rulesLoading} style={btnStyle(rulesLoading)}>
          {rulesLoading ? "AI 分析中…" : "重新生成因果規則"}
        </button>
        {rulesError && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#1a0c0a", border: "1px solid #5a2820", borderRadius: 4, fontSize: 12, color: "#f08070", lineHeight: 1.6, wordBreak: "break-word" }}>
            <strong>錯誤：</strong>{rulesError}
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 12, color: "#6a6460", lineHeight: 1.6 }}>
          每次執行會清除未驗證規則，重新從目前資料生成 6–10 條。<br />
          已手動標記「已驗證」的規則不會被清除。需要先設定 Anthropic API Key（Admin → 系統設定）。
        </div>
      </div>
    </div>
  );
}
