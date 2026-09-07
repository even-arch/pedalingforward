"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  ja: "日本語",
  de: "DE",
};

const NAV_ITEMS = [
  { key: "shops",        msgKey: "forShops" },
  { key: "suppliers",    msgKey: "forSuppliers" },
  { key: "distributors", msgKey: "forDistributors" },
  { key: "how-it-works", msgKey: "howItWorks" },
  { key: "intelligence", msgKey: "marketIntel" },
  { key: "about",        msgKey: "about" },
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const locale   = useLocale() as Locale;
  const pathname = usePathname();
  const router   = useRouter();
  const t        = useTranslations("nav");

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function switchLocale(next: Locale) {
    const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
    router.push(`/${next}${withoutLocale}`);
    setOpen(false);
  }

  return (
    <>
      <header>
        <div className="wrap bar">

          {/* Logo */}
          <Link href={`/${locale}`} className="brand-link flex-shrink-0" onClick={() => setOpen(false)}>
            <Image
              src="/brand/pf-logo-red.svg"
              alt="Pedaling Forward"
              width={220}
              height={54}
              priority
              style={{ height: "54px", width: "auto" }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="main hidden md:flex" aria-label="Main navigation">
            {NAV_ITEMS.map(({ key, msgKey }) => {
              const href   = `/${locale}/${key}`;
              const active = pathname.startsWith(href);
              return (
                <Link key={key} href={href} aria-current={active ? "page" : undefined}>
                  {t(msgKey)}
                </Link>
              );
            })}
          </nav>

          {/* Desktop: language switcher + CTA */}
          <div className="hidden md:flex items-center gap-4">
            <div className="lang">
              {routing.locales.map((loc) => (
                loc === locale ? (
                  <b key={loc}>{LOCALE_LABELS[loc]}</b>
                ) : (
                  <span key={loc} onClick={() => switchLocale(loc)}>
                    {LOCALE_LABELS[loc]}
                  </span>
                )
              ))}
            </div>
            <a href="https://patisco.com" target="_blank" rel="noopener noreferrer" className="btn">
              {t("goToPatisco")}
            </a>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="hamburger md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            )}
          </button>

        </div>
      </header>

      {/* Mobile menu panel */}
      {open && (
        <div className="mobile-nav" role="dialog" aria-label="Navigation">
          <nav>
            {NAV_ITEMS.map(({ key, msgKey }) => {
              const href   = `/${locale}/${key}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {t(msgKey)}
                </Link>
              );
            })}
          </nav>

          <div className="mobile-nav-footer">
            <div className="lang">
              {routing.locales.map((loc) => (
                loc === locale ? (
                  <b key={loc}>{LOCALE_LABELS[loc]}</b>
                ) : (
                  <span key={loc} onClick={() => switchLocale(loc)}>
                    {LOCALE_LABELS[loc]}
                  </span>
                )
              ))}
            </div>
            <a href="https://patisco.com" target="_blank" rel="noopener noreferrer" className="btn">
              {t("goToPatisco")}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
