import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function Footer() {
  const [t, locale] = await Promise.all([
    getTranslations("footer"),
    getLocale(),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Image
              src="/brand/pf-logo-white.svg"
              alt="Pedaling Forward"
              width={140}
              height={28}
              className="h-7 w-auto"
            />
            <p className="text-sm text-stone-400">{t("tagline")}</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-stone-300">
            <a
              href="https://patisco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              {t("patiscoLink")}
            </a>
            <Link href={`/${locale}/join/suppliers`} className="hover:text-white transition-colors">
              {t("writingLink")}
            </Link>
            <Link href={`/${locale}/about`} className="hover:text-white transition-colors">
              {t("aboutLink")}
            </Link>
            <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">
              {t("contactLink")}
            </Link>
          </nav>

          {/* Social + Point Asia */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com/pedalingforward"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-white transition-colors text-sm"
              >
                Facebook
              </a>
              <a
                href="https://instagram.com/pedalingforward"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-white transition-colors text-sm"
              >
                Instagram
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="/brand/pointasia-logo-lowres.png"
                alt="Point Asia Co., Ltd."
                width={80}
                height={24}
                className="h-6 w-auto brightness-0 invert opacity-70"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-stone-700 pt-6 text-xs text-stone-500">
          {t("rights", { year })}
        </div>
      </div>
    </footer>
  );
}
