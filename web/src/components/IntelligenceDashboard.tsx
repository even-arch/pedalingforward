"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportMetric    = { reporterCode: string; hsCode: string; period: string; value: number };
type ExportMetric    = { reporterCode: string; hsCode: string; period: string; value: number };
type BilateralMetric = { reporterCode: string; partnerCode: string; hsCode: string; period: string; value: number };
type GlobalEvent = {
  id: string; title: string; eventDate: string; countries: string[];
  tags: string[]; source: string; tone?: number;
};
type CausalRule = {
  id: string; hsCode: string; triggerEvent: string; triggerTags: string[];
  tradeOutcome: string; lagMonths: number; confidence: number; verified: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPORT_COLORS: Record<string, string> = {
  DE: "#D5352A", US: "#4a9eff", NL: "#f59e0b", GB: "#9f7aea", JP: "#22c55e",
};
const SUPPLY_COLORS: Record<string, string> = {
  TW: "#D5352A", CN: "#f59e0b", IT: "#4a9eff", VN: "#22c55e",
  PL: "#9f7aea", JP: "#ff6b35", CZ: "#06b6d4", TH: "#a855f7",
  AT: "#ec4899", BE: "#14b8a6", PT: "#f97316", FR: "#84cc16",
  GB: "#8b5cf6", KR: "#0ea5e9", DE: "#6b7280", CH: "#d97706",
  HK: "#be185d", MY: "#10b981", IN: "#f43f5e", US: "#94a3b8",
  Other: "#C5C0BA",
};

// Alpha-3 ISO codes (used in DB events) → Alpha-2 (used in Intl.DisplayNames)
const A3_TO_A2: Record<string, string> = {
  JPN: "JP", DEU: "DE", USA: "US", NLD: "NL", GBR: "GB",
};

function partnerColor(code: string): string {
  if (SUPPLY_COLORS[code]) return SUPPLY_COLORS[code];
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff;
  return `hsl(${h % 360}, 55%, 52%)`;
}

type HsCode = "8714" | "8712" | "871430" | "871160";

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function IntelligenceDashboard({ locale }: { locale: string }) {
  const t = useTranslations("intelligence");

  // Country display names via browser Intl API (locale-aware)
  const dn = useMemo(() => {
    try {
      const tag = locale === "zh" ? "zh-TW" : locale;
      return new Intl.DisplayNames([tag], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);
  const countryName = (code2: string) => {
    if (!dn) return code2;
    try { return dn.of(code2) ?? code2; } catch { return code2; }
  };

  const [importMetrics, setImportMetrics] = useState<ImportMetric[]>([]);
  const [exportMetrics, setExportMetrics] = useState<ExportMetric[]>([]);
  const [bilateralMetrics, setBilateralMetrics] = useState<BilateralMetric[]>([]);
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [rules, setRules] = useState<CausalRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [chartMode, setChartMode] = useState<"import" | "supply">("import");
  const [activeHs, setActiveHs] = useState<HsCode>("8714");
  const [supplyMarket, setSupplyMarket] = useState<string>("DE");
  const [activeCountries, setActiveCountries] = useState<Set<string>>(
    new Set(["DE", "US", "NL", "GB", "JP"])
  );
  const [activePartners, setActivePartners] = useState<Set<string>>(new Set<string>());
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

  // ── Available partners for selected market ────────────────────────────────
  const availablePartners = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const m of bilateralMetrics) {
      if (m.reporterCode !== supplyMarket) continue;
      const key = m.partnerCode.replace("PARTNER_", "");
      if (key === "_ALL_") continue;
      if (m.hsCode !== activeHs && !(activeHs === "871430" && m.hsCode === "8714")) continue;
      totals[key] = (totals[key] ?? 0) + m.value;
    }
    return Object.entries(totals)
      .filter(([, v]) => v > 100_000)
      .sort(([, a], [, b]) => b - a)
      .map(([code]) => code);
  }, [bilateralMetrics, supplyMarket, activeHs]);

  useEffect(() => {
    if (availablePartners.length > 0) {
      setActivePartners(new Set([...availablePartners, "Other"]));
    }
  }, [availablePartners]);

  // ── Chart data ────────────────────────────────────────────────────────────
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

  const supplyChartData = useMemo(() => {
    const worldByPeriod: Record<string, number> = {};
    const hsFallback = activeHs === "871430" ? "8714" : activeHs;
    for (const m of importMetrics) {
      if (m.reporterCode === supplyMarket && (m.hsCode === activeHs || m.hsCode === hsFallback)) {
        if (m.hsCode === activeHs || !worldByPeriod[m.period]) {
          worldByPeriod[m.period] = m.value / 1_000_000;
        }
      }
    }
    const byPeriod: Record<string, Record<string, number>> = {};
    for (const m of bilateralMetrics) {
      if (m.reporterCode !== supplyMarket) continue;
      const hsMatch = m.hsCode === activeHs || (activeHs === "871430" && m.hsCode === "8714");
      if (!hsMatch) continue;
      const partnerKey = m.partnerCode.replace("PARTNER_", "");
      if (partnerKey === "_ALL_" || partnerKey === supplyMarket) continue;
      if (!byPeriod[m.period]) byPeriod[m.period] = {};
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

  // ── Stats ─────────────────────────────────────────────────────────────────
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

  // ── Helpers for translated strings ────────────────────────────────────────
  const hsLabel = (hs: string) => {
    const map: Record<string, string> = {
      "8714": t("hs8714"), "8712": t("hs8712"),
      "871430": t("hs871430"), "871160": t("hs871160"),
    };
    return map[hs] ?? hs;
  };

  const chartImportTitle = (hs: string) => {
    const map: Record<string, string> = {
      "8714": t("chartImportTitle8714"), "8712": t("chartImportTitle8712"),
      "871430": t("chartImportTitle871430"), "871160": t("chartImportTitle871160"),
    };
    return map[hs] ?? hs;
  };

  const chartSupplyTitle = (hs: string, market: string) => {
    const map: Record<string, string> = {
      "8714": t("chartSupplyTitle8714", { market }),
      "8712": t("chartSupplyTitle8712", { market }),
      "871430": t("chartSupplyTitle871430", { market }),
      "871160": t("chartSupplyTitle871160", { market }),
    };
    return map[hs] ?? hs;
  };

  const tagLabel = (tag: string) => {
    // "demand_collapse" → "tagDemand_collapse" to match message keys
    const norm = tag.replace(/[^a-z0-9_]/gi, "_");
    const key = `tag${norm.charAt(0).toUpperCase()}${norm.slice(1)}` as Parameters<typeof t>[0];
    try { return t(key); } catch { return tag; }
  };

  if (loading) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center", color: "#6E6760" }}>
        <span className="lab">{t("loading")}</span>
      </div>
    );
  }

  const supplyMarketName = countryName(supplyMarket);

  return (
    <>
      {/* ── Stats strip (dark bg continuation from hero) ── */}
      <div className="field-ink">
        <div className="wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingBottom: 56 }}>
          <div className="stats">
            {[
              { n: periodRange,                     k: t("statsPeriod") },
              { n: events.length.toLocaleString(),  k: t("statsEvents") },
              { n: rules.length.toLocaleString(),   k: t("statsRules") },
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
          {/* Mode + HS selectors */}
          <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 0 }}>
              {(["import", "supply"] as const).map((mode, i) => {
                const label = mode === "import" ? t("modeImport") : t("modeSupply");
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
                    {label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["8714", "8712", "871430", "871160"] as HsCode[]).map((hs) => (
                <Chip key={hs} label={hsLabel(hs)} active={activeHs === hs} onClick={() => setActiveHs(hs)} />
              ))}
            </div>
          </div>

          {/* Supply chain market selector */}
          {chartMode === "supply" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
              <span className="lab" style={{ color: "#6E6760" }}>{t("marketLabel")}</span>
              {Object.keys(IMPORT_COLORS).map((code) => (
                <Chip
                  key={code}
                  label={countryName(code)}
                  active={supplyMarket === code}
                  color={IMPORT_COLORS[code]}
                  onClick={() => setSupplyMarket(code)}
                />
              ))}
            </div>
          )}

          {/* Chart header + country toggles */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p className="lab" style={{ color: "#6E6760", marginBottom: 6 }}>
                {chartMode === "import"
                  ? t("chartImportLead")
                  : t("chartSupplyLead", { market: supplyMarketName })}
              </p>
              <h2 style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                {chartMode === "import"
                  ? chartImportTitle(activeHs)
                  : chartSupplyTitle(activeHs, supplyMarketName)}
              </h2>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {chartMode === "import"
                ? Object.entries(IMPORT_COLORS).map(([code, color]) => (
                    <Chip key={code} label={countryName(code)} active={activeCountries.has(code)}
                      color={color} onClick={() => toggleCountry(code)} />
                  ))
                : availablePartners.map((code) => (
                    <Chip key={code} label={countryName(code) ?? code} active={activePartners.has(code)}
                      color={partnerColor(code)} onClick={() => togglePartner(code)} />
                  ))}
            </div>
          </div>

          {/* Chart */}
          {chartData.length === 0 && (
            <div style={{ background: "#fff", border: "1px solid #DDD8D1", padding: "80px 24px", textAlign: "center" }}>
              <p className="lab" style={{ color: "#6E6760" }}>
                {chartMode === "supply"
                  ? t("emptyBilateral", { market: supplyMarketName })
                  : t("emptyImport", { hs: hsLabel(activeHs) })}
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
                        ? countryName(String(name ?? ""))
                        : (countryName(String(name ?? "")) ?? String(name ?? ""));
                      return [`$${Number(value ?? 0).toFixed(1)}M`, label];
                    }}
                  />
                  <Legend
                    formatter={(v: string) => (
                      <span style={{ color: "#6E6760", fontSize: 11, fontFamily: "var(--font-ibm-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {countryName(v) ?? v}
                      </span>
                    )}
                  />
                  {chartMode === "import" && dePeak && (
                    <ReferenceLine
                      x={dePeak}
                      stroke="#D5352A"
                      strokeDasharray="4 4"
                      label={{ value: t("dePeak"), fill: "#D5352A", fontSize: 10, fontFamily: "var(--font-ibm-mono, monospace)" }}
                    />
                  )}
                  {chartMode === "import" &&
                    Object.entries(IMPORT_COLORS).map(([code, color]) =>
                      activeCountries.has(code) ? (
                        <Line key={code} type="monotone" dataKey={code} stroke={color}
                          dot={false} strokeWidth={2} connectNulls />
                      ) : null
                    )}
                  {chartMode === "supply" &&
                    [...availablePartners, "Other"].map((code) =>
                      activePartners.has(code) ? (
                        <Line key={code} type="monotone" dataKey={code} stroke={partnerColor(code)}
                          dot={false} strokeWidth={code === "TW" ? 2.5 : code === "Other" ? 1 : 1.5}
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
              ? t("unitImport")
              : t("unitSupply", { market: supplyMarketName })}
          </p>
        </div>
      </section>

      {/* ── Events + Rules ── */}
      <section className="tight" style={{ background: "#fff" }}>
        <div className="wrap">
          {/* Tab bar */}
          <div className="feedhead">
            <h2 style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 800, letterSpacing: "-0.018em", margin: 0 }}>
              {activeTab === "events" ? t("tabEvents", { n: events.length }) : t("tabRules", { n: rules.length })}
            </h2>
            <div style={{ display: "flex", gap: 0, marginLeft: "auto" }}>
              {([
                { key: "events" as const, label: t("tabEvents", { n: events.length }) },
                { key: "rules"  as const, label: t("tabRules",  { n: rules.length }) },
              ]).map(({ key, label }, i) => (
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
                <span className="lab" style={{ color: "#6E6760" }}>{t("filterLabel")}</span>
                {([null, "JPN", "DEU", "USA", "NLD", "GBR"] as (string | null)[]).map((c) => (
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
                    {c === null ? t("filterAll") : (countryName(A3_TO_A2[c] ?? c) ?? c)}
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
                      {new Date(ev.eventDate).toLocaleDateString(locale === "zh" ? "zh-TW" : locale, { year: "2-digit", month: "short" })}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, color: "#14120F", marginBottom: 8, lineHeight: 1.45 }}>
                        {ev.title}
                      </p>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {ev.tags.map((tag) => (
                          <span key={tag} style={{
                            fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10, fontWeight: 600,
                            letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px",
                            background: "#F3F0EB", color: "#6E6760",
                          }}>
                            {tagLabel(tag)}
                          </span>
                        ))}
                        {ev.countries.map((c) => (
                          <span key={c} style={{
                            fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10, fontWeight: 600,
                            letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px",
                            background: "#D5352A18", color: "#D5352A",
                          }}>
                            {countryName(A3_TO_A2[c] ?? c) ?? c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="lab" style={{ color: "#6E6760", fontSize: 10, whiteSpace: "nowrap", paddingTop: 3 }}>
                      {tagLabel(ev.source)}
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
                    }}>{t("lag", { n: r.lagMonths })}</span>
                    {r.verified && (
                      <span style={{
                        fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10.5, fontWeight: 600,
                        letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px",
                        background: "#D5352A", color: "#fff",
                      }}>{t("verified")}</span>
                    )}
                    {r.triggerTags.map((tag) => (
                      <span key={tag} style={{
                        fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10,
                        letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 7px",
                        background: "#F3F0EB", color: "#6E6760",
                      }}>
                        {tagLabel(tag)}
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
                    <span className="lab" style={{ color: "#6E6760", minWidth: 52 }}>{t("confidence")}</span>
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
