"use client";

import Image from "next/image";
import Link from "next/link";
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
  const locale   = useLocale() as Locale;
  const pathname = usePathname();
  const router   = useRouter();
  const t        = useTranslations("nav");

  function switchLocale(next: Locale) {
    const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
    router.push(`/${next}${withoutLocale}`);
  }

  return (
    <header>
      <div className="wrap bar">

        {/* Logo */}
        <Link href={`/${locale}`} className="brand-link flex-shrink-0">
          <Image
            src="/brand/pf-logo-red.svg"
            alt="Pedaling Forward"
            width={220}
            height={54}
            priority
            style={{ height: "54px", width: "auto" }}
          />
        </Link>

        {/* Nav */}
        <nav className="main hidden md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map(({ key, msgKey }) => {
            const href   = `/${locale}/${key}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                {t(msgKey)}
              </Link>
            );
          })}
        </nav>

        {/* Language switcher + Patisco CTA */}
        <div className="flex items-center gap-4 ml-auto md:ml-0">
          <div className="lang hidden sm:flex">
            {routing.locales.map((loc) => (
              loc === locale ? (
                <b key={loc}>{LOCALE_LABELS[loc]}</b>
              ) : (
                <span
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  style={{ cursor: "pointer", opacity: 1 }}
                >
                  {LOCALE_LABELS[loc]}
                </span>
              )
            ))}
          </div>

          <a
            href="https://patisco.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn hidden sm:inline-flex"
          >
            {t("goToPatisco")}
          </a>
        </div>

      </div>
    </header>
  );
}
