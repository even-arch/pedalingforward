"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AuthCtx = createContext<{ token: string; logout: () => void } | null>(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AdminLayout");
  return ctx;
}

function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        onLogin(pw);
      } else {
        setError("密碼錯誤");
        setPw("");
      }
    } catch {
      setError("連線失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f0e0c" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <form onSubmit={submit} style={{ background: "#1a1916", border: "1px solid #2a2824", borderRadius: 8, padding: "40px 48px", width: 320 }}>
            <div style={{ color: "#D5352A", fontWeight: 700, letterSpacing: "0.1em", fontSize: 12, textTransform: "uppercase", marginBottom: 24 }}>
              Pedaling Forward · Admin
            </div>
            <input
              type="password"
              placeholder="管理員密碼"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#0f0e0c", border: "1px solid #2a2824", borderRadius: 4, color: "#fff", fontSize: 14, outline: "none", marginBottom: 12 }}
            />
            {error && <div style={{ color: "#D5352A", fontSize: 13, marginBottom: 8 }}>{error}</div>}
            <button
              type="submit"
              disabled={loading || !pw}
              style={{ width: "100%", padding: "10px", background: "#D5352A", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              {loading ? "驗證中…" : "登入"}
            </button>
          </form>
        </div>
      </body>
    </html>
  );
}

const NAV = [
  { href: "/admin/media", label: "情報室" },
  { href: "/admin/compose", label: "草稿" },
  { href: "/admin/settings", label: "設定" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("pf_admin_pw");
    setToken(stored);
    setChecked(true);
  }, []);

  function handleLogin(pw: string) {
    localStorage.setItem("pf_admin_pw", pw);
    setToken(pw);
  }

  function logout() {
    localStorage.removeItem("pf_admin_pw");
    setToken(null);
  }

  if (!checked) return null;

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AuthCtx.Provider value={{ token, logout }}>
      <html lang="zh-TW">
        <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f0e0c", color: "#e8e4df" }}>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Sidebar */}
            <nav style={{ width: 200, background: "#141210", borderRight: "1px solid #2a2824", padding: "24px 0", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "0 20px 24px", color: "#D5352A", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                PF Admin
              </div>
              {NAV.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "block",
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#fff" : "#8a8278",
                      background: active ? "#1e1c19" : "transparent",
                      textDecoration: "none",
                      borderLeft: active ? "3px solid #D5352A" : "3px solid transparent",
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
              <div style={{ marginTop: "auto", padding: "16px 20px" }}>
                <button
                  onClick={logout}
                  style={{ background: "none", border: "1px solid #2a2824", color: "#8a8278", padding: "6px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
                >
                  登出
                </button>
              </div>
            </nav>

            {/* Content */}
            <main style={{ flex: 1, padding: "32px 40px", overflow: "auto" }}>
              {children}
            </main>
          </div>
        </body>
      </html>
    </AuthCtx.Provider>
  );
}
