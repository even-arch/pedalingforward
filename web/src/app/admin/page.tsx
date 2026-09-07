"use client";

import Link from "next/link";

type Widget = {
  href: string;
  external?: boolean;
  title: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
};

const WIDGETS: Widget[] = [
  {
    href: "/admin/media",
    title: "情報室",
    desc: "收集 RSS 來源、閱讀情報、分類並生成草稿文章。",
    badge: "核心",
    badgeColor: "#D5352A",
  },
  {
    href: "/admin/compose",
    title: "文章管理",
    desc: "預覽、編輯、補齊各語言翻譯，並將文章發布到 Sanity。",
  },
  {
    href: "/admin/content",
    title: "網站內容",
    desc: "初始化靜態頁面（五頁 × 四語）與首頁 Hero 文字，並觸發 AI 重新翻譯。",
  },
  {
    href: "/admin/settings",
    title: "系統設定",
    desc: "管理員密碼、AI API Keys、Telegram 通知設定、AI 寫作規則。",
  },
  {
    href: "/admin/data",
    title: "貿易資料",
    desc: "從 UN Comtrade 補抓最新月份 HS 8714 / 8712 資料。每月 5 號自動執行，也可手動觸發。",
  },
  {
    href: "/studio",
    external: true,
    title: "Sanity Studio",
    desc: "直接在 CMS 裡編輯文章、品牌、分類、靜態頁面等所有內容。",
    badge: "外部",
    badgeColor: "#3a3630",
  },
];

const card: React.CSSProperties = {
  background: "#141210",
  border: "1px solid #2a2824",
  borderRadius: 8,
  padding: "28px 28px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  textDecoration: "none",
  color: "inherit",
  transition: "border-color 0.15s",
};

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: "#fff" }}>後台首頁</h1>
      <p style={{ margin: "0 0 40px", color: "#5a5650", fontSize: 14 }}>選擇一個功能進入操作。</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {WIDGETS.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            target={w.external ? "_blank" : undefined}
            rel={w.external ? "noopener noreferrer" : undefined}
            style={card}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4a4440")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2824")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{w.title}</span>
              {w.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "2px 8px", borderRadius: 3,
                  background: w.badgeColor ?? "#2a2824", color: w.badgeColor === "#D5352A" ? "#fff" : "#8a8278",
                }}>
                  {w.badge}
                </span>
              )}
              {w.external && (
                <span style={{ marginLeft: "auto", color: "#3a3630", fontSize: 16 }}>↗</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#8a8278", lineHeight: 1.65 }}>{w.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
