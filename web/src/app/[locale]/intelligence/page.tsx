"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

type TradeMetric = { reporterCode: string; period: string; value: number };
type GlobalEvent = {
  id: string; title: string; eventDate: string; countries: string[];
  tags: string[]; source: string; tone?: number;
};
type CausalRule = {
  id: string; hsCode: string; triggerEvent: string; triggerTags: string[];
  tradeOutcome: string; lagMonths: number; confidence: number; verified: boolean;
};

const COUNTRY_COLORS: Record<string, string> = {
  DE: "#D5352A",
  US: "#4a9eff",
  NL: "#ff8c00",
  GB: "#9f7aea",
  JP: "#f59e0b",
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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric" });
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "#4caf50" : pct >= 55 ? "#f59e0b" : "#8a8278";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "#2a2824", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

export default function IntelligencePage() {
  const [metrics, setMetrics] = useState<TradeMetric[]>([]);
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [rules, setRules] = useState<CausalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCountries, setActiveCountries] = useState<Set<string>>(new Set(["DE", "US", "NL", "GB", "JP"]));
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

  // Build chart data: one row per period, one key per country
  const chartData = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {};
    for (const m of metrics) {
      if (!byPeriod[m.period]) byPeriod[m.period] = {};
      byPeriod[m.period][m.reporterCode] = m.value / 1_000_000; // EUR millions
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

  // Find peak period for DE (largest market)
  const dePeak = useMemo(() => {
    const de = metrics.filter((m) => m.reporterCode === "DE");
    if (!de.length) return null;
    return de.reduce((a, b) => (a.value > b.value ? a : b)).period;
  }, [metrics]);

  if (loading) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "#5a5650" }}>
        載入中…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#D5352A", textTransform: "uppercase", marginBottom: 8 }}>
          Market Intelligence
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
          全球自行車零件貿易情報
        </h1>
        <p style={{ color: "#7a7672", fontSize: 14, margin: 0, maxWidth: 600 }}>
          HS 8714 自行車零件進口量走勢、產業事件與因果規則｜資料來源：UN Comtrade、Eurostat
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 40 }}>
        {[
          { label: "貿易數據", value: metrics.length.toLocaleString(), sub: "筆月度紀錄" },
          { label: "涵蓋期間", value: "2019–2024", sub: "6 年完整數據" },
          { label: "產業事件", value: events.length.toLocaleString(), sub: "筆事件記錄" },
          { label: "因果規則", value: rules.length.toLocaleString(), sub: "條 AI 推論規則" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: "#100f0d", border: "1px solid #1e1c19", borderRadius: 6, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#5a5650", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{value}</div>
            <div style={{ fontSize: 11, color: "#3a3530" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Trade chart */}
      <div style={{ background: "#0d0c0a", border: "1px solid #1e1c19", borderRadius: 8, padding: "24px", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e4df" }}>HS 8714 進口量（單位：百萬歐元／美元）</div>
            <div style={{ fontSize: 11, color: "#5a5650", marginTop: 2 }}>自行車零件月度進口總額，按市場國家分類</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
              <button key={code} onClick={() => toggleCountry(code)} style={{
                padding: "4px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
                background: activeCountries.has(code) ? COUNTRY_COLORS[code] + "22" : "transparent",
                border: `1px solid ${activeCountries.has(code) ? COUNTRY_COLORS[code] : "#2a2824"}`,
                color: activeCountries.has(code) ? COUNTRY_COLORS[code] : "#5a5650",
              }}>
                {name}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1c19" />
            <XAxis dataKey="period" tick={{ fill: "#5a5650", fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(0, 7)}
              interval={5} />
            <YAxis tick={{ fill: "#5a5650", fontSize: 10 }} width={48}
              tickFormatter={(v: number) => `€${v.toFixed(0)}M`} />
            <Tooltip
              contentStyle={{ background: "#1a1814", border: "1px solid #2a2824", borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: "#c8c4c0" }}
              formatter={(value, name) => [`€${Number(value ?? 0).toFixed(1)}M`, COUNTRY_NAMES[String(name ?? "")] ?? String(name ?? "")]}
            />
            <Legend formatter={(v: string) => <span style={{ color: "#8a8278", fontSize: 11 }}>{COUNTRY_NAMES[v] ?? v}</span>} />
            {dePeak && <ReferenceLine x={dePeak} stroke="#D5352A44" strokeDasharray="4 4" label={{ value: "高峰", fill: "#D5352A", fontSize: 10 }} />}
            {Object.entries(COUNTRY_COLORS).map(([code, color]) =>
              activeCountries.has(code) ? (
                <Line key={code} type="monotone" dataKey={code} stroke={color}
                  dot={false} strokeWidth={1.5} connectNulls />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Events + Rules tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e1c19", marginBottom: 20 }}>
        {[
          { key: "events" as const, label: `產業事件（${events.length}）` },
          { key: "rules" as const, label: `因果規則（${rules.length}）` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "8px 18px", background: "none", border: "none",
            borderBottom: activeTab === key ? "2px solid #D5352A" : "2px solid transparent",
            color: activeTab === key ? "#D5352A" : "#5a5650",
            cursor: "pointer", fontSize: 13, fontWeight: activeTab === key ? 600 : 400, marginBottom: -1,
          }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "events" && (
        <>
          {/* Country filter for events */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => setFilterCountry(null)} style={{
              padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
              background: !filterCountry ? "#D5352A22" : "transparent",
              border: `1px solid ${!filterCountry ? "#D5352A" : "#2a2824"}`,
              color: !filterCountry ? "#D5352A" : "#5a5650",
            }}>全部</button>
            {["JPN", "DEU", "USA", "NLD", "GBR"].map((c) => (
              <button key={c} onClick={() => setFilterCountry(filterCountry === c ? null : c)} style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
                background: filterCountry === c ? "#ffffff11" : "transparent",
                border: `1px solid ${filterCountry === c ? "#8a8278" : "#2a2824"}`,
                color: filterCountry === c ? "#c8c4c0" : "#5a5650",
              }}>{c}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {filteredEvents.slice(0, 60).map((ev) => (
              <div key={ev.id} style={{ padding: "12px 14px", background: "#0a0908", borderRadius: 4, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 68, fontSize: 11, color: "#5a5650", paddingTop: 2 }}>
                  {new Date(ev.eventDate).toLocaleDateString("zh-TW", { year: "2-digit", month: "short" })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#c8c4c0", marginBottom: 4, lineHeight: 1.4 }}>{ev.title}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ev.tags.map((t) => (
                      <span key={t} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#1a1814", color: "#5a5650", border: "1px solid #2a2824" }}>
                        {TAG_LABELS[t] ?? t}
                      </span>
                    ))}
                    {ev.countries.map((c) => (
                      <span key={c} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#1a1814", color: "#4a9eff", border: "1px solid #1a2a3a" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ minWidth: 48, fontSize: 10, color: "#3a3530", textAlign: "right" }}>
                  {TAG_LABELS[ev.source] ?? ev.source}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "rules" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rules.map((r) => (
            <div key={r.id} style={{ background: "#0a0908", border: "1px solid #1e1c19", borderRadius: 6, padding: "16px 18px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#1a1814", color: "#8a9adf", border: "1px solid #2a2844" }}>
                  HS {r.hsCode}
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#1a1814", color: "#a09890", border: "1px solid #2a2824" }}>
                  延遲 {r.lagMonths}M
                </span>
                {r.verified && (
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#1a2a1a", color: "#4caf50", border: "1px solid #2a402a" }}>
                    ✓ 已驗證
                  </span>
                )}
                {r.triggerTags.map((t) => (
                  <span key={t} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#1a1814", color: "#5a5650", border: "1px solid #2a2824" }}>
                    {TAG_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: "#e8e4df", marginBottom: 6, fontWeight: 500 }}>{r.triggerEvent}</div>
              <div style={{ fontSize: 12, color: "#7a7672", marginBottom: 10, lineHeight: 1.5 }}>{r.tradeOutcome}</div>
              <ConfidenceBar value={r.confidence} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
