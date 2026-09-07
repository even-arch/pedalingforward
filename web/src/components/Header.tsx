"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  ja: "日本語",
  de: "DE",
};

const NAV = [
  { key: "shops",        label: "For Shops" },
  { key: "suppliers",    label: "For Suppliers" },
  { key: "distributors", label: "For Distributors" },
  { key: "how-it-works", label: "How it works" },
  { key: "intelligence", label: "Market Intel" },
  { key: "about",        label: "About" },
];

export default function Header() {
  const locale   = useLocale() as Locale;
  const pathname = usePathname();
  const router   = useRouter();

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
          {NAV.map(({ key, label }) => {
            const href   = `/${locale}/${key}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                {label}
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
            Go to Patisco
          </a>
        </div>

      </div>
    </header>
  );
}
