"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

type TradeMetric = { reporterCode: string; period: string; value: number };
type GlobalEvent = {
  id: string; title: string; eventDate: string; countries: string[];
  tags: string[]; source: string; tone?: number; url?: string;
};
type CausalRule = {
  id: string; hsCode: string; triggerEvent: string; triggerTags: string[];
  tradeOutcome: string; lagMonths: number; confidence: number; verified: boolean;
};

const COUNTRY_COLORS: Record<string, string> = {
  DE: "#D5352A",
  US: "#4a9eff",
  NL: "#f59e0b",
  GB: "#9f7aea",
  JP: "#22c55e",
};

const COUNTRY_NAMES: Record<string, string> = {
  DE: "德國",
  US: "美國",
  NL: "荷蘭",
  GB: "英國",
  JP: "日本",
};

const TAG_LABELS: Record<string, string> = {
  demand_collapse: "需求崩跌",
  supply_chain: "供應鏈",
  tariff: "關稅",
  demand_shift: "需求轉移",
  lockdown: "封控",
  financial_results: "財報",
  inventory: "庫存",
  association_report: "產業報告",
  gdelt: "GDELT",
  newsapi: "新聞",
  wto: "WTO",
};

export default function IntelligencePage() {
  const [metrics, setMetrics] = useState<TradeMetric[]>([]);
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [rules, setRules] = useState<CausalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCountries, setActiveCountries] = useState<Set<string>>(
    new Set(["DE", "US", "NL", "GB", "JP"])
  );
  const [activeTab, setActiveTab] = useState<"events" | "rules">("events");
  const [filterCountry, setFilterCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/intelligence?section=overview")
      .then((r) => r.json())
      .then(({ metrics, events, rules }) => {
        setMetrics(metrics ?? []);
        setEvents(events ?? []);
        setRules(rules ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {};
    for (const m of metrics) {
      if (!byPeriod[m.period]) byPeriod[m.period] = {};
      byPeriod[m.period][m.reporterCode] = m.value / 1_000_000;
    }
    return Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => ({ period, ...vals }));
  }, [metrics]);

  const toggleCountry = (c: string) =>
    setActiveCountries((prev) => {
      const n = new Set(prev);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });

  const filteredEvents = filterCountry
    ? events.filter((e) => e.countries.includes(filterCountry))
    : events;

  const dePeak = useMemo(() => {
    const de = metrics.filter((m) => m.reporterCode === "DE");
    if (!de.length) return null;
    return de.reduce((a, b) => (a.value > b.value ? a : b)).period;
  }, [metrics]);

  if (loading) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center", color: "#6E6760" }}>
        <span className="lab">載入中…</span>
      </div>
    );
  }

  return (
    <>
      {/* ── Page head ── */}
      <div className="field-ink">
        <div className="wrap">
          <div className="phead" style={{ paddingBottom: 72 }}>
            <p className="lab" style={{ color: "#D5352A", marginBottom: 24 }}>
              Market Intelligence
            </p>
            <h1 className="display" style={{ fontSize: "clamp(36px, 5vw, 72px)", color: "#fff", marginBottom: 24, maxWidth: "18ch" }}>
              全球自行車零件貿易情報
            </h1>
            <p className="lead" style={{ color: "rgba(255,255,255,0.75)", maxWidth: "54ch" }}>
              HS 8714 自行車零件進口量走勢、產業事件與 AI 推論因果規則。
              資料來源：UN Comtrade、Eurostat，涵蓋 2019–2024 年。
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingBottom: 56 }}>
          <div className="stats">
            {[
              { n: metrics.length.toLocaleString(), k: "筆月度貿易紀錄" },
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
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p className="lab" style={{ color: "#6E6760", marginBottom: 8 }}>進口量走勢</p>
              <h2 style={{ fontSize: "clamp(22px, 2.4vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                HS 8714 自行車零件月度進口額
              </h2>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => toggleCountry(code)}
                  style={{
                    padding: "6px 14px",
                    border: `2px solid ${activeCountries.has(code) ? COUNTRY_COLORS[code] : "#DDD8D1"}`,
                    background: activeCountries.has(code) ? COUNTRY_COLORS[code] + "18" : "transparent",
                    color: activeCountries.has(code) ? COUNTRY_COLORS[code] : "#6E6760",
                    fontFamily: "var(--font-ibm-mono, monospace)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

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
                  tickFormatter={(v: number) => `€${v.toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #DDD8D1", borderRadius: 0, fontSize: 12, fontFamily: "var(--font-ibm-mono, monospace)" }}
                  labelStyle={{ color: "#14120F", fontWeight: 600 }}
                  formatter={(value, name) => [
                    `€${Number(value ?? 0).toFixed(1)}M`,
                    COUNTRY_NAMES[String(name ?? "")] ?? String(name ?? ""),
                  ]}
                />
                <Legend
                  formatter={(v: string) => (
                    <span style={{ color: "#6E6760", fontSize: 11, fontFamily: "var(--font-ibm-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {COUNTRY_NAMES[v] ?? v}
                    </span>
                  )}
                />
                {dePeak && (
                  <ReferenceLine
                    x={dePeak}
                    stroke="#D5352A"
                    strokeDasharray="4 4"
                    label={{ value: "高峰", fill: "#D5352A", fontSize: 10, fontFamily: "var(--font-ibm-mono, monospace)" }}
                  />
                )}
                {Object.entries(COUNTRY_COLORS).map(([code, color]) =>
                  activeCountries.has(code) ? (
                    <Line
                      key={code}
                      type="monotone"
                      dataKey={code}
                      stroke={color}
                      dot={false}
                      strokeWidth={2}
                      connectNulls
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ marginTop: 10, fontFamily: "var(--font-ibm-mono, monospace)", fontSize: 10.5, color: "#6E6760", letterSpacing: "0.06em" }}>
            單位：百萬歐元／美元（進口額）｜資料：UN Comtrade、Eurostat
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
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "8px 18px",
                    background: activeTab === key ? "#14120F" : "transparent",
                    border: "2px solid #14120F",
                    borderRight: key === "events" ? "none" : "2px solid #14120F",
                    color: activeTab === key ? "#fff" : "#14120F",
                    fontFamily: "var(--font-ibm-mono, monospace)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "events" && (
            <>
              {/* Country filter */}
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
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                    }}
                  >
                    {c === null ? "全部" : c}
                  </button>
                ))}
              </div>

              {/* Events list */}
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
                    <span
                      className="lab"
                      style={{ color: "#6E6760", paddingTop: 3, lineHeight: 1.4 }}
                    >
                      {new Date(ev.eventDate).toLocaleDateString("zh-TW", { year: "2-digit", month: "short" })}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15, color: "#14120F", marginBottom: 8, lineHeight: 1.45 }}>
                        {ev.title}
                      </p>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {ev.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontFamily: "var(--font-ibm-mono, monospace)",
                              fontSize: 10,
                              fontWeight: 600,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              background: "#F3F0EB",
                              color: "#6E6760",
                            }}
                          >
                            {TAG_LABELS[t] ?? t}
                          </span>
                        ))}
                        {ev.countries.map((c) => (
                          <span
                            key={c}
                            style={{
                              fontFamily: "var(--font-ibm-mono, monospace)",
                              fontSize: 10,
                              fontWeight: 600,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              background: "#D5352A18",
                              color: "#D5352A",
                            }}
                          >
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
                <div
                  key={r.id}
                  style={{
                    padding: "28px 0 30px",
                    borderBottom: `1px solid ${i % 2 === 0 ? "#DDD8D1" : "#EEE9E3"}`,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-ibm-mono, monospace)",
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        padding: "3px 9px",
                        background: "#14120F",
                        color: "#fff",
                      }}
                    >
                      HS {r.hsCode}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-ibm-mono, monospace)",
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        padding: "3px 9px",
                        background: "#F3F0EB",
                        color: "#6E6760",
                      }}
                    >
                      延遲 {r.lagMonths}M
                    </span>
                    {r.verified && (
                      <span
                        style={{
                          fontFamily: "var(--font-ibm-mono, monospace)",
                          fontSize: 10.5,
                          fontWeight: 600,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          padding: "3px 9px",
                          background: "#D5352A",
                          color: "#fff",
                        }}
                      >
                        ✓ 已驗證
                      </span>
                    )}
                    {r.triggerTags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontFamily: "var(--font-ibm-mono, monospace)",
                          fontSize: 10,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          padding: "2px 7px",
                          background: "#F3F0EB",
                          color: "#6E6760",
                        }}
                      >
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

                  {/* Confidence bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 320 }}>
                    <span className="lab" style={{ color: "#6E6760", minWidth: 52 }}>信心值</span>
                    <div style={{ flex: 1, height: 3, background: "#DDD8D1" }}>
                      <div
                        style={{
                          width: `${Math.round(r.confidence * 100)}%`,
                          height: "100%",
                          background: r.confidence >= 0.75 ? "#14120F" : r.confidence >= 0.55 ? "#D5352A" : "#6E6760",
                        }}
                      />
                    </div>
                    <span
                      className="lab"
                      style={{
                        color: r.confidence >= 0.75 ? "#14120F" : r.confidence >= 0.55 ? "#D5352A" : "#6E6760",
                        minWidth: 32,
                        textAlign: "right",
                      }}
                    >
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
