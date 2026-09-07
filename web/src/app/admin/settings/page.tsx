"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../layout";

type Settings = {
  adminPassword?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  firecrawlApiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  aiWritingRules?: string;
};

type IngestResult = { task: string; saved: number; error?: string };

export default function SettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResults, setIngestResults] = useState<IngestResult[] | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast("✅ 已儲存");
      } else {
        const data = await res.json();
        showToast(`錯誤: ${data.error ?? "Unknown"}`);
      }
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSettings((s) => ({ ...s, [key]: e.target.value }));

  async function runIngest() {
    setIngesting(true);
    setIngestResults(null);
    setIngestError(null);
    try {
      const res = await fetch("/api/admin/ingest-trade", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setIngestResults(data.results ?? []);
      showToast(`✅ 更新完成，共存入 ${data.totalSaved} 筆`);
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : String(err));
      showToast("❌ 更新失敗");
    } finally {
      setIngesting(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#e8e4df", fontSize: 13, outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#a09890", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" };

  if (loading) return <div style={{ color: "#8a8278" }}>載入中…</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1c19", border: "1px solid #2a2824", borderRadius: 6, padding: "12px 20px", color: "#e8e4df", zIndex: 200, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <h1 style={{ margin: "0 0 32px", fontSize: 22, fontWeight: 700, color: "#fff" }}>設定</h1>

      <form onSubmit={save}>
        {/* Access */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a5650", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>存取控制</div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>管理員密碼</label>
            <input type="password" value={settings.adminPassword ?? ""} onChange={set("adminPassword")} style={inputStyle} />
          </div>
        </div>

        {/* AI Keys */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a5650", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>AI API Keys</div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Anthropic API Key</label>
            <input type="password" value={settings.anthropicApiKey ?? ""} onChange={set("anthropicApiKey")} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>OpenAI API Key</label>
            <input type="password" value={settings.openaiApiKey ?? ""} onChange={set("openaiApiKey")} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Firecrawl API Key</label>
            <input type="password" value={settings.firecrawlApiKey ?? ""} onChange={set("firecrawlApiKey")} style={inputStyle} />
            <div style={{ fontSize: 11, color: "#5a5650", marginTop: 4 }}>用來抓取原文全文。沒有也行，會改用 RSS 摘要。</div>
          </div>
        </div>

        {/* Telegram */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a5650", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Telegram 通知</div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Bot Token</label>
            <input type="password" value={settings.telegramBotToken ?? ""} onChange={set("telegramBotToken")} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Chat ID</label>
            <input type="text" value={settings.telegramChatId ?? ""} onChange={set("telegramChatId")} style={inputStyle} placeholder="-1001234567890" />
          </div>
        </div>

        {/* Writing rules */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5a5650", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>AI 寫作規則</div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>風格指南</label>
            <textarea value={settings.aiWritingRules ?? ""} onChange={set("aiWritingRules")} rows={8}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>

        <button type="submit" disabled={saving}
          style={{ padding: "10px 28px", background: saving ? "#6a3020" : "#D5352A", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          {saving ? "儲存中…" : "儲存"}
        </button>
      </form>

      {/* Trade data ingest */}
      <div style={{ marginTop: 48, marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#5a5650", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>貿易資料更新</div>
        <p style={{ fontSize: 13, color: "#8a8278", marginBottom: 16, lineHeight: 1.6 }}>
          從 UN Comtrade 補抓最新月份資料（HS 8714 / 8712 / 871430，進口市場 + 出口國 + 雙邊來源）。每月 5 號 02:00 自動執行，也可手動觸發。
        </p>
        <button
          type="button"
          onClick={runIngest}
          disabled={ingesting}
          style={{
            padding: "10px 24px",
            background: ingesting ? "#2a2824" : "#1e1c19",
            border: "1px solid #3a3630",
            color: ingesting ? "#5a5650" : "#e8e4df",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
            cursor: ingesting ? "not-allowed" : "pointer",
          }}
        >
          {ingesting ? "更新中…（可能需要數分鐘）" : "立即從 Comtrade 更新"}
        </button>

        {ingestError && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#2a1410", border: "1px solid #6a2820", borderRadius: 4, color: "#f08070", fontSize: 12 }}>
            {ingestError}
          </div>
        )}

        {ingestResults && ingestResults.length > 0 && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#141210", border: "1px solid #2a2824", borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: "#5a5650", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              更新結果
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "2px 16px", fontSize: 12 }}>
              {ingestResults.filter((r) => r.saved > 0 || r.error).map((r) => (
                <>
                  <span key={`${r.task}-task`} style={{ color: "#a09890", fontFamily: "monospace" }}>{r.task}</span>
                  <span key={`${r.task}-saved`} style={{ color: r.saved > 0 ? "#6aaa70" : "#5a5650", textAlign: "right" }}>
                    {r.saved > 0 ? `+${r.saved}` : "—"}
                  </span>
                  <span key={`${r.task}-err`} style={{ color: "#9a5040", fontSize: 11 }}>{r.error ?? ""}</span>
                </>
              ))}
            </div>
            {ingestResults.every((r) => r.saved === 0 && !r.error) && (
              <div style={{ color: "#5a5650", fontSize: 12 }}>全部都是最新的，沒有新資料</div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 0, padding: 16, background: "#141210", border: "1px solid #2a2824", borderRadius: 6 }}>
        <div style={{ fontSize: 12, color: "#5a5650", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Vercel 環境變數（優先於此頁設定）</div>
        <div style={{ fontSize: 12, color: "#8a8278", lineHeight: 1.8 }}>
          {[
            ["SANITY_WRITE_TOKEN", "必填"],
            ["ADMIN_PASSWORD", "可選"],
            ["ANTHROPIC_API_KEY", "可選"],
            ["OPENAI_API_KEY", "可選"],
            ["FIRECRAWL_API_KEY", "可選"],
            ["TELEGRAM_BOT_TOKEN", "可選"],
            ["TELEGRAM_CHAT_ID", "可選"],
            ["CRON_SECRET", "建議設定"],
          ].map(([name, note]) => (
            <div key={name}>• <code style={{ color: "#a09890" }}>{name}</code> — {note}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
