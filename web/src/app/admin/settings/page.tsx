"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../layout";

type Settings = {
  adminPassword?: string;
  anthropicApiKey?: string;
  aiWritingRules?: string;
};

export default function SettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const field = (label: string, key: keyof Settings, type: "text" | "password" | "textarea" = "text") => (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a09890", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={settings[key] ?? ""}
          onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
          rows={8}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#e8e4df", fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.6 }}
        />
      ) : (
        <input
          type={type}
          value={settings[key] ?? ""}
          onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#e8e4df", fontSize: 13, outline: "none" }}
        />
      )}
    </div>
  );

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
        {field("管理員密碼", "adminPassword", "password")}
        {field("Anthropic API Key", "anthropicApiKey", "password")}
        {field("AI 寫作規則", "aiWritingRules", "textarea")}

        <button
          type="submit"
          disabled={saving}
          style={{ padding: "10px 28px", background: saving ? "#6a3020" : "#D5352A", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
      </form>

      <div style={{ marginTop: 48, padding: 16, background: "#141210", border: "1px solid #2a2824", borderRadius: 6 }}>
        <div style={{ fontSize: 12, color: "#5a5650", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Vercel 環境變數說明</div>
        <div style={{ fontSize: 12, color: "#8a8278", lineHeight: 1.7 }}>
          <div>• <code style={{ color: "#a09890" }}>SANITY_WRITE_TOKEN</code> — Sanity Editor token（必填）</div>
          <div>• <code style={{ color: "#a09890" }}>ADMIN_PASSWORD</code> — 覆蓋此頁管理員密碼（可選）</div>
          <div>• <code style={{ color: "#a09890" }}>ANTHROPIC_API_KEY</code> — 覆蓋此頁 API Key（可選）</div>
          <div>• <code style={{ color: "#a09890" }}>CRON_SECRET</code> — 保護 cron 端點（建議設定）</div>
        </div>
      </div>
    </div>
  );
}
