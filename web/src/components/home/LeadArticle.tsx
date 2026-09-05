import Link from 'next/link'
import { urlFor } from '@/sanity/image'
import { loc, formatDate } from '@/lib/locale'

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null }

type Post = {
  _id: string
  title?: LocalizedStr | null
  slug?: { current?: string | null } | null
  publishedAt?: string | null
  excerpt?: LocalizedStr | null
  mainImage?: { asset?: unknown; alt?: LocalizedStr | null } | null
  category?: { title?: LocalizedStr | null; slug?: { current?: string | null } | null } | null
  author?: { name?: string | null } | null
}

type Props = { post: Post; locale: string }

export function LeadArticle({ post, locale }: Props) {
  const title = loc(post.title, locale)
  const excerpt = loc(post.excerpt, locale)
  const category = loc(post.category?.title, locale)
  const date = formatDate(post.publishedAt, locale)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 pb-10 mb-10 border-b border-stone-200">
      {/* Image */}
      <div className="relative aspect-[4/3] rounded overflow-hidden flex items-end p-5 bg-stone-800">
        {post.mainImage?.asset ? (
          <img
            src={urlFor(post.mainImage as Parameters<typeof urlFor>[0])
              .width(800)
              .height(600)
              .fit('crop')
              .url()}
            alt={loc(post.mainImage.alt, locale) || title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        {category && (
          <span className="relative z-10 font-mono text-[10px] tracking-[0.12em] uppercase bg-brand text-white px-2 py-1 rounded-sm">
            {category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center gap-4">
        {category && (
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-brand">
            {category}
          </span>
        )}
        <h2 className="font-serif text-2xl lg:text-[1.875rem] font-bold leading-[1.25] text-ink text-balance">
          {title}
        </h2>
        {excerpt && (
          <p className="font-serif text-base text-stone-500 leading-[1.72]">{excerpt}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-stone-400">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.author?.name && date && <span className="text-stone-300">·</span>}
          {date && <span>{date}</span>}
        </div>
        <Link
          href={`/${locale}/articles/${post.slug?.current ?? ''}`}
          className="self-start inline-flex items-center gap-1 text-[0.9375rem] font-bold text-ink border-b-2 border-brand pb-0.5 mt-1 hover:text-brand transition-colors"
        >
          Read article →
        </Link>
      </div>
    </div>
  )
}
