"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

type ImportMetric  = { reporterCode: string; hsCode: string; period: string; value: number };
type ExportMetric  = { reporterCode: string; hsCode: string; period: string; value: number };
type BilateralMetric = { reporterCode: string; partnerCode: string; hsCode: string; period: string; value: number };
type GlobalEvent = {
  id: string; title: string; eventDate: string; countries: string[];
  tags: string[]; source: string; tone?: number;
};
type CausalRule = {
  id: string; hsCode: string; triggerEvent: string; triggerTags: string[];
  tradeOutcome: string; lagMonths: number; confidence: number; verified: boolean;
};

// ── Constants ────────────────────────────────────────────────────────────────

const IMPORT_COUNTRY_COLORS: Record<string, string> = {
  DE: "#D5352A", US: "#4a9eff", NL: "#f59e0b", GB: "#9f7aea", JP: "#22c55e",
};
const IMPORT_COUNTRY_NAMES: Record<string, string> = {
  DE: "德國", US: "美國", NL: "荷蘭", GB: "英國", JP: "日本",
};

const SUPPLY_PARTNER_COLORS: Record<string, string> = {
  TW: "#D5352A", CN: "#f59e0b", IT: "#4a9eff", VN: "#22c55e",
  PL: "#9f7aea", JP: "#ff6b35", US: "#6E6760", Other: "#C5C0BA",
};
const SUPPLY_PARTNER_NAMES: Record<string, string> = {
  TW: "台灣", CN: "中國", IT: "義大利", VN: "越南",
  PL: "波蘭", JP: "日本", US: "美國", Other: "其他",
};

const TAG_LABELS: Record<string, string> = {
  demand_collapse: "需求崩跌", supply_chain: "供應鏈", tariff: "關稅",
  demand_shift: "需求轉移", lockdown: "封控", financial_results: "財報",
  inventory: "庫存", association_report: "產業報告", gdelt: "GDELT",
  newsapi: "新聞", wto: "WTO",
};

const HS_LABELS: Record<string, string> = {
  "8714":   "HS 8714 零件",
  "8712":   "HS 8712 整車",
  "871430": "HS 871430 電動零件",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function Chip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick?: () => void }) {
  const c = color ?? "#14120F";
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        border: `2px solid ${active ? c : "#DDD8D1"}`,
        background: active ? c + "18" : "transparent",
        color: active ? c : "#6E6760",
        fontFamily: "var(--font-ibm-mono, monospace)",
        fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
        textTransform: "uppercase", cursor: onClick ? "pointer" : "default",
      }}
    >
      {label}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const [importMetrics, setImportMetrics] = useState<ImportMetric[]>([]);
  const [exportMetrics, setExportMetrics] = useState<ExportMetric[]>([]);
  const [bilateralMetrics, setBilateralMetrics] = useState<BilateralMetric[]>([]);
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [rules, setRules] = useState<CausalRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [chartMode, setChartMode] = useState<"import" | "supply">("import");
  const [activeHs, setActiveHs] = useState<"8714" | "8712" | "871430">("8714");
  const [supplyMarket, setSupplyMarket] = useState<string>("DE");
  const [activeCountries, setActiveCountries] = useState<Set<string>>(
    new Set(["DE", "US", "NL", "GB", "JP"])
  );
  const [activePartners, setActivePartners] = useState<Set<string>>(
    new Set(["TW", "CN", "IT", "VN", "PL", "Other"])
  );
  const [activeTab, setActiveTab] = useState<"events" | "rules">("events");
  const [filterCountry, setFilterCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/intelligence?section=overview")
      .then((r) => r.json())
      .then((data) => {
        setImportMetrics(data.importMetrics ?? data.metrics ?? []);
        setExportMetrics(data.exportMetrics ?? []);
        setBilateralMetrics(data.bilateralMetrics ?? []);
        setEvents(data.events ?? []);
        setRules(data.rules ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Chart data: import market view ──────────────────────────────────────

  const importChartData = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {};
    for (const m of importMetrics) {
      if (m.hsCode !== activeHs) continue;
      if (!byPeriod[m.period]) byPeriod[m.period] = {};
      byPeriod[m.period][m.reporterCode] = m.value / 1_000_000;
    }
    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => ({ period, ...vals }));
  }, [importMetrics, activeHs]);

  // ── Chart data: supply chain view (bilateral, any market) ─────────────────

  const supplyChartData = useMemo(() => {
    // World total for selected market + HS code
    const worldByPeriod: Record<string, number> = {};
    // For 871430, fall back to 8714 world total if 871430 world not available
    const hsFallback = activeHs === "871430" ? "8714" : activeHs;
    for (const m of importMetrics) {
      if (m.reporterCode === supplyMarket && (m.hsCode === activeHs || m.hsCode === hsFallback)) {
        // Prefer exact HS match
        if (m.hsCode === activeHs || !worldByPeriod[m.period]) {
          worldByPeriod[m.period] = m.value / 1_000_000;
        }
      }
    }

    // Bilateral breakdown by partner for the selected market
    const byPeriod: Record<string, Record<string, number>> = {};
    for (const m of bilateralMetrics) {
      if (m.reporterCode !== supplyMarket) continue;
      // For 871430 bilateral, fall back to 8714 if 871430-specific bilateral not available
      const hsMatch = m.hsCode === activeHs || (activeHs === "871430" && m.hsCode === "8714");
      if (!hsMatch) continue;
      if (!byPeriod[m.period]) byPeriod[m.period] = {};
      const partnerKey = m.partnerCode.replace("PARTNER_", "");
      byPeriod[m.period][partnerKey] = (byPeriod[m.period][partnerKey] ?? 0) + m.value / 1_000_000;
    }

    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => {
        const namedTotal = Object.values(vals).reduce((s, v) => s + v, 0);
        const worldTotal = worldByPeriod[period] ?? 0;
        const other = worldTotal > namedTotal + 0.01 ? parseFloat((worldTotal - namedTotal).toFixed(2)) : undefined;
        return { period, ...vals, ...(other !== undefined ? { Other: other } : {}) };
      });
  }, [bilateralMetrics, importMetrics, activeHs, supplyMarket]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const periodRange = useMemo(() => {
    const all = [...importMetrics, ...exportMetrics].map((m) => m.period);
    if (!all.length) return "—";
    const sorted = all.sort();
    return `${sorted[0].slice(0, 4)} – ${sorted[sorted.length - 1].slice(0, 7)}`;
  }, [importMetrics, exportMetrics]);

  const dePeak = useMemo(() => {
    const de = importMetrics.filter((m) => m.reporterCode === "DE" && m.hsCode === activeHs);
    if (!de.length) return null;
    return de.reduce((a, b) => (a.value > b.value ? a : b)).period;
  }, [importMetrics, activeHs]);

  const filteredEvents = filterCountry
    ? events.filter((e) => e.countries.includes(filterCountry))
    : events;

  const chartData = chartMode === "import" ? importChartData : supplyChartData;

  const toggleCountry = (c: string) =>
    setActiveCountries((prev) => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });

  const togglePartner = (p: string) =>
    setActivePartners((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });

  if (loading) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center", color: "#6E6760" }}>
        <span className="lab">載入中…</span>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Hero ── */}
      <div className="field-ink">
        <div className="wrap">
          <div className="phead" style={{ paddingBottom: 72 }}>
            <p className="lab" style={{ color: "#D5352A", marginBottom: 24 }}>Market Intelligence</p>
            <h1
              className="display"
              style={{ fontSize: "clamp(36px, 5vw, 72px)", color: "#fff", marginBottom: 24, maxWidth: "18ch" }}
            >
              全球自行車貿易情報
            </h1>
            <p className="lead" style={{ color: "rgba(255,255,255,0.75)", maxWidth: "54ch" }}>
              進出口量走勢、主要供應鏈分佈、產業事件與 AI 因果規則。
              資料來源：UN Comtrade，每月更新。
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingBottom: 56 }}>
          <div className="stats">
            {[
              { n: periodRange, k: "資料涵蓋期間" },
              { n: events.length.toLocaleString(), k: "筆全球產業事件" },
              { n: rules.length.toLocaleString(), k: "條 AI 推論因果規則" },
            ].map(({ n, k }) => (
              <div className="stat" key={k}>
                <div className="n">{n}</div>
                <div className="k">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trade chart ── */}
      <section className="tight" style={{ background: "#F3F0EB" }}>
        <div className="wrap">
          {/* Chart mode + HS code selector */}
          <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 0 }}>
              {(["import", "supply"] as const).map((mode, i) => {
                const labels = { import: "進口市場", supply: "德國供應鏈" };
                const active = chartMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    style={{
                      padding: "8px 18px",
                      background: active ? "#14120F" : "transparent",
                      border: "2px solid #14120F",
                      borderRight: i === 0 ? "none" : "2px solid #14120F",
                      color: active ? "#fff" : "#14120F",
                      fontFamily: "var(--font-ibm-mono, monospace)",
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                      textTransform: "uppercase", cursor: "pointer",
                    }}
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>

            {/* HS code toggle */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["8714", "8712", "871430"] as const).map((hs) => (
                <Chip
                  key={hs}
                  label={HS_LABELS[hs]}
                  active={activeHs === hs}
                  onClick={() => setActiveHs(hs)}
                />
              ))}
            </div>
          </div>

          {/* Supply chain market selector */}
          {chartMode === "supply" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
              <span className="lab" style={{ color: "#6E6760" }}>分析市場：</span>
              {Object.entries(IMPORT_COUNTRY_NAMES).map(([code, name]) => (
                <Chip
                  key={code}
                  label={name}
                  active={supplyMarket === code}
                  color={IMPORT_COUNTRY_COLORS[code]}
                  onClick={() => setSupplyMarket(code)}
                />
              ))}
            </div>
          )}

          {/* Chart header + country toggles */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p className="lab" style={{ color: "#6E6760", marginBottom: 6 }}>
                {chartMode === "import" ? "主要市場月度進口額" : `${IMPORT_COUNTRY_NAMES[supplyMarket] ?? supplyMarket} 進口來源分佈`}
              </p>
              <h2 style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                {chartMode === "import"
                  ? ({ "8714": "自行車零件", "8712": "整車", "871430": "電動自行車零件" }[activeHs] ?? activeHs) + "月度進口額"
                  : ({ "8714": "零件", "8712": "整車", "871430": "電動零件" }[activeHs] ?? activeHs) + "採購來源（" + (IMPORT_COUNTRY_NAMES[supplyMarket] ?? supplyMarket) + "）"}
              </h2>
            </div>

            {/* Toggle buttons */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {chartMode === "import"
                ? Object.entries(IMPORT_COUNTRY_NAMES).map(([code, name]) => (
                    <Chip key={code} label={name} active={activeCountries.has(code)}
                      color={IMPORT_COUNTRY_COLORS[code]} onClick={() => toggleCountry(code)} />
                  ))
                : Object.entries(SUPPLY_PARTNER_NAMES).map(([code, name]) => (
                    <Chip key={code} label={name} active={activePartners.has(code)}
                      color={SUPPLY_PARTNER_COLORS[code]} onClick={() => togglePartner(code)} />
                  ))}
            </div>
          </div>

          {/* Chart */}
          {chartData.length === 0 && (
            <div style={{ background: "#fff", border: "1px solid #DDD8D1", padding: "80px 24px", textAlign: "center" }}>
              <p className="lab" style={{ color: "#6E6760" }}>
                {chartMode === "supply"
                  ? `${IMPORT_COUNTRY_NAMES[supplyMarket] ?? supplyMarket} 的雙邊來源資料補充中，稍後自動更新`
                  : "資料載入中"}
              </p>
            </div>
          )}
          {chartData.length > 0 && (
          <div style={{ background: "#fff", padding: "24px 8px 24px 0", border: "1px solid #DDD8D1" }}>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDD8D1" />
                <XAxis
                  dataKey="period"
                  tick={{ fill: "#6E6760", fontSize: 10, fontFamily: "var(--font-ibm-mono, monospace)" }}
                  tickFormatter={(v: string) => v.slice(0, 7)}
                  interval={5}
                />
                <YAxis
                  tick={{ fill: "#6E6760", fontSize: 10, fontFamily: "var(--font-ibm-mono, monospace)" }}
                  width={52}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #DDD8D1", borderRadius: 0, fontSize: 12, fontFamily: "var(--font-ibm-mono, monospace)" }}
                  labelStyle={{ color: "#14120F", fontWeight: 600 }}
                  formatter={(value, name) => {
                    const label = chartMode === "import"
                      ? (IMPORT_COUNTRY_NAMES[String(name ?? "")] ?? String(name ?? ""))
                      : (SUPPLY_PARTNER_NAMES[String(name ?? "")] ?? String(name ?? ""));
                    return [`$${Number(value ?? 0).toFixed(1)}M`, label];
                  }}
                />
                <Legend
                  formatter={(v: string) => {
                    const label = chartMode === "import"
                      ? (IMPORT_COUNTRY_NAMES[v] ?? v)
                      : (SUPPLY_PARTNER_NAMES[v] ?? v);
                    return (
                      <span style={{ color: "#6E6760", fontSize: 11, fontFamily: "var(--font-ibm-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {label}
                      </span>
                    );
                  }}
                />
                {chartMode === "import" && dePeak && (
                  <ReferenceLine
                    x={dePeak}
                    stroke="#D5352A"
                    strokeDasharray="4 4"
                    label={{ value: "DE高峰", fill: "#D5352A", fontSize: 10, fontFamily: "var(--font-ibm-mono, monospace)" }}
                  />
                )}

                {/* Import market lines */}
                {chartMode === "import" &&
                  Object.entries(IMPORT_COUNTRY_COLORS).map(([code, color]) =>
                    activeCountries.has(code) ? (
                      <Line key={code} type="monotone" dataKey={code} stroke={color}
                        dot={false} strokeWidth={2} connectNulls />
                    ) : null
                  )}

                {/* Supply chain lines */}
                {chartMode === "supply" &&
                  Object.entries(SUPPLY_PARTNER_COLORS).map(([code, color]) =>
                    activePartners.has(code) ? (
                      <Line key={code} type="monotone" dataKey={code} stroke={color}
                        dot={false} strokeWidth={code === "TW" ? 2.5 : 1.5}
                        strokeDasharray={code === "Other" ? "4 3" : undefined}
                        connectNulls />
                    ) : null
                  )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}

          <p style={{ marginTop: 10, fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10.5, color: "#6E6760", letterSpacing: "0.06em" }}>
            {chartMode === "import"
              ? "單位：百萬美元（各國進口申報）｜資料：UN Comtrade"
              : `單位：百萬美元（${IMPORT_COUNTRY_NAMES[supplyMarket] ?? supplyMarket}進口申報，依來源國拆分）｜台灣不在 UN 成員名單，以各市場對台進口代替｜資料：UN Comtrade`}
          </p>
        </div>
      </section>

      {/* ── Events + Rules ── */}
      <section className="tight" style={{ background: "#fff" }}>
        <div className="wrap">
          {/* Tab bar */}
          <div className="feedhead">
            <h2 style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 800, letterSpacing: "-0.018em", margin: 0 }}>
              {activeTab === "events" ? "產業事件" : "因果規則"}
            </h2>
            <div style={{ display: "flex", gap: 0, marginLeft: "auto" }}>
              {[
                { key: "events" as const, label: `事件（${events.length}）` },
                { key: "rules" as const, label: `規則（${rules.length}）` },
              ].map(({ key, label }, i) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "8px 18px",
                    background: activeTab === key ? "#14120F" : "transparent",
                    border: "2px solid #14120F",
                    borderRight: i === 0 ? "none" : "2px solid #14120F",
                    color: activeTab === key ? "#fff" : "#14120F",
                    fontFamily: "var(--font-ibm-mono, monospace)",
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                    textTransform: "uppercase", cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "events" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                <span className="lab" style={{ color: "#6E6760" }}>篩選國家：</span>
                {[null, "JPN", "DEU", "USA", "NLD", "GBR"].map((c) => (
                  <button
                    key={c ?? "all"}
                    onClick={() => setFilterCountry(filterCountry === c ? null : c)}
                    style={{
                      padding: "4px 12px",
                      border: `1px solid ${filterCountry === c || (c === null && !filterCountry) ? "#14120F" : "#DDD8D1"}`,
                      background: filterCountry === c || (c === null && !filterCountry) ? "#14120F" : "transparent",
                      color: filterCountry === c || (c === null && !filterCountry) ? "#fff" : "#6E6760",
                      fontFamily: "var(--font-ibm-mono, monospace)",
                      fontSize: 11, letterSpacing: "0.1em", cursor: "pointer",
                    }}
                  >
                    {c === null ? "全部" : c}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: "2px solid #14120F" }}>
                {filteredEvents.slice(0, 60).map((ev, i) => (
                  <div
                    key={ev.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr auto",
                      gap: "0 24px",
                      alignItems: "start",
                      padding: "18px 0",
                      borderBottom: `1px solid ${i % 2 === 0 ? "#DDD8D1" : "#EEE9E3"}`,
                    }}
                  >
                    <span className="lab" style={{ color: "#6E6760", paddingTop: 3, lineHeight: 1.4 }}>
                      {new Date(ev.eventDate).toLocaleDateString("zh-TW", { year: "2-digit", month: "short" })}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, color: "#14120F", marginBottom: 8, lineHeight: 1.45 }}>
                        {ev.title}
                      </p>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {ev.tags.map((t) => (
                          <span key={t} style={{
                            fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10, fontWeight: 600,
                            letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px",
                            background: "#F3F0EB", color: "#6E6760",
                          }}>
                            {TAG_LABELS[t] ?? t}
                          </span>
                        ))}
                        {ev.countries.map((c) => (
                          <span key={c} style={{
                            fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10, fontWeight: 600,
                            letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px",
                            background: "#D5352A18", color: "#D5352A",
                          }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="lab" style={{ color: "#6E6760", fontSize: 10, whiteSpace: "nowrap", paddingTop: 3 }}>
                      {TAG_LABELS[ev.source] ?? ev.source}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "rules" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "2px solid #14120F" }}>
              {rules.map((r, i) => (
                <div key={r.id} style={{ padding: "28px 0 30px", borderBottom: `1px solid ${i % 2 === 0 ? "#DDD8D1" : "#EEE9E3"}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10.5, fontWeight: 600,
                      letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px",
                      background: "#14120F", color: "#fff",
                    }}>HS {r.hsCode}</span>
                    <span style={{
                      fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10.5, fontWeight: 600,
                      letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px",
                      background: "#F3F0EB", color: "#6E6760",
                    }}>延遲 {r.lagMonths}M</span>
                    {r.verified && (
                      <span style={{
                        fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10.5, fontWeight: 600,
                        letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px",
                        background: "#D5352A", color: "#fff",
                      }}>✓ 已驗證</span>
                    )}
                    {r.triggerTags.map((t) => (
                      <span key={t} style={{
                        fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10,
                        letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 7px",
                        background: "#F3F0EB", color: "#6E6760",
                      }}>
                        {TAG_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>

                  <p style={{ fontWeight: 700, fontSize: 17, color: "#14120F", marginBottom: 8, lineHeight: 1.4, maxWidth: "68ch" }}>
                    {r.triggerEvent}
                  </p>
                  <p style={{ fontSize: 15, color: "#6E6760", marginBottom: 16, lineHeight: 1.6, maxWidth: "68ch" }}>
                    {r.tradeOutcome}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 320 }}>
                    <span className="lab" style={{ color: "#6E6760", minWidth: 52 }}>信心值</span>
                    <div style={{ flex: 1, height: 3, background: "#DDD8D1" }}>
                      <div style={{
                        width: `${Math.round(r.confidence * 100)}%`,
                        height: "100%",
                        background: r.confidence >= 0.75 ? "#14120F" : r.confidence >= 0.55 ? "#D5352A" : "#6E6760",
                      }} />
                    </div>
                    <span className="lab" style={{
                      color: r.confidence >= 0.75 ? "#14120F" : r.confidence >= 0.55 ? "#D5352A" : "#6E6760",
                      minWidth: 32, textAlign: "right",
                    }}>
                      {Math.round(r.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
