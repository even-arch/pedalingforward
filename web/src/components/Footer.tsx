import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function Footer() {
  const locale = await getLocale();
  const t      = await getTranslations({ locale, namespace: "footer" });
  const year   = new Date().getFullYear();

  return (
    <footer>
      <div className="wrap">

        <div className="fgrid">

          {/* Logo + tagline */}
          <div>
            <div className="flogo">
              <Image
                src="/brand/pf-logo-red.svg"
                alt="Pedaling Forward"
                width={250}
                height={62}
                style={{ filter: "brightness(0) invert(1)", height: "auto", width: "100%" }}
              />
            </div>
            <p className="ftag">{t("tagline")}</p>
          </div>

          {/* Trade */}
          <div>
            <h5>{t("tradeHeading")}</h5>
            <div className="flist">
              <a href="https://patisco.com" target="_blank" rel="noopener noreferrer">
                {t("patiscoLink")}
              </a>
              <a href="#">{t("writingLink")}</a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h5>{t("companyHeading")}</h5>
            <div className="flist">
              <Link href={`/${locale}/about`}>{t("aboutLink")}</Link>
              <a href="#">{t("contactLink")}</a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h5>{t("socialHeading")}</h5>
            <div className="flist">
              <a href="https://facebook.com/pedalingforward" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
              <a href="https://instagram.com/pedalingforward" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="fbot">
          <Image
            src="/brand/pointasia-logo-lowres.png"
            alt="Point Asia Co., Ltd."
            width={80}
            height={34}
            style={{ height: "34px", width: "auto", background: "#fff", padding: "6px 9px" }}
          />
          <span>{t("rights", { year })}</span>
        </div>

      </div>
    </footer>
  );
}
