import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("meta");
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-brand mb-4">
        Coming Soon
      </p>
      <h1 className="text-4xl font-bold text-ink mb-4">Pedaling Forward</h1>
      <p className="text-lg text-stone-500 max-w-md">{t("description")}</p>
    </div>
  );
}
