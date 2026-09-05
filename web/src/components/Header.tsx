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

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: Locale) {
    // pathname includes the current locale prefix, e.g. /en/about
    const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
    router.push(`/${next}${withoutLocale}`);
  }

  return (
    <header className="border-b border-stone-200 bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex-shrink-0">
            <Image
              src="/brand/pf-logo-red.svg"
              alt="Pedaling Forward"
              width={160}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href={`/${locale}/join/shops`}
              className="text-sm font-medium text-ink hover:text-brand transition-colors"
            >
              {t("forShops")}
            </Link>
            <Link
              href={`/${locale}/join/suppliers`}
              className="text-sm font-medium text-ink hover:text-brand transition-colors"
            >
              {t("forSuppliers")}
            </Link>
            <Link
              href={`/${locale}/join/distributors`}
              className="text-sm font-medium text-ink hover:text-brand transition-colors"
            >
              {t("forDistributors")}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center gap-1">
              {routing.locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    loc === locale
                      ? "bg-brand text-white"
                      : "text-ink hover:bg-muted"
                  }`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>

            {/* Patisco CTA */}
            <a
              href="https://patisco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors sm:block"
            >
              {t("goToPatisco")}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
