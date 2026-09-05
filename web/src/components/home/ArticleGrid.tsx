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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainImage?: { asset?: any; alt?: LocalizedStr | null } | null
  category?: { title?: LocalizedStr | null } | null
  author?: { name?: string | null } | null
}

const GRADIENTS = [
  'from-amber-900 via-amber-800 to-stone-800',
  'from-emerald-900 via-emerald-800 to-stone-800',
  'from-violet-900 via-violet-800 to-stone-800',
]

type Props = { posts: Post[]; locale: string }

export function ArticleGrid({ posts, locale }: Props) {
  if (!posts.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {posts.map((post, i) => {
        const title = loc(post.title, locale)
        const excerpt = loc(post.excerpt, locale)
        const category = loc(post.category?.title, locale)
        const date = formatDate(post.publishedAt, locale)

        return (
          <Link
            key={post._id}
            href={`/${locale}/articles/${post.slug?.current ?? ''}`}
            className="group flex flex-col bg-white border border-stone-200 rounded overflow-hidden hover:border-stone-300 transition-colors"
          >
            <div
              className={`relative aspect-[16/10] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} overflow-hidden`}
            >
              {post.mainImage?.asset && (
                <img
                  src={urlFor(post.mainImage as Parameters<typeof urlFor>[0])
                    .width(600)
                    .height(375)
                    .fit('crop')
                    .url()}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col gap-2.5 p-5 flex-1">
              {category && (
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-brand">
                  {category}
                </span>
              )}
              <h3 className="font-serif text-base font-bold leading-[1.35] text-ink text-balance group-hover:text-brand transition-colors">
                {title}
              </h3>
              {excerpt && (
                <p className="font-serif text-sm text-stone-500 leading-relaxed line-clamp-2 flex-1">
                  {excerpt}
                </p>
              )}
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-stone-400 border-t border-stone-100 pt-3 mt-1">
                {[post.author?.name, date].filter(Boolean).join(' · ')}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
