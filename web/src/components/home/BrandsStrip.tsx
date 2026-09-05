type Brand = { _id: string; name: string }
type Props = { brands: Brand[] }

export function BrandsStrip({ brands }: Props) {
  if (!brands.length) return null

  return (
    <div className="bg-muted border-y border-stone-200 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-stone-500 mb-5">
          Brands we cover
        </p>
        <div className="flex flex-wrap gap-2.5">
          {brands.map((brand) => (
            <span
              key={brand._id}
              className="text-sm font-medium bg-white border border-stone-200 rounded-full px-4 py-1.5 text-ink"
            >
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
