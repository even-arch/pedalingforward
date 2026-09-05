import Link from "next/link";
import { urlFor } from "@/sanity/image";
import { loc, formatDate } from "@/lib/locale";

type LocalizedStr = { en?: string | null; zh?: string | null; ja?: string | null; de?: string | null };

type Post = {
  _id: string;
  title?: LocalizedStr | null;
  slug?: { current?: string | null } | null;
  publishedAt?: string | null;
  excerpt?: LocalizedStr | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainImage?: { asset?: any; alt?: LocalizedStr | null } | null;
  category?: { title?: LocalizedStr | null } | null;
  author?: { name?: string | null } | null;
};

type Props = { posts: Post[]; locale: string };

export function ArticleGrid({ posts, locale }: Props) {
  if (!posts.length) return null;

  return (
    <>
      {posts.map((post) => {
        const title    = loc(post.title, locale);
        const excerpt  = loc(post.excerpt, locale);
        const category = loc(post.category?.title, locale);
        const date     = formatDate(post.publishedAt, locale);

        return (
          <Link key={post._id} href={`/${locale}/articles/${post.slug?.current ?? ""}`} className="item">
            <div className="ph">
              {post.mainImage?.asset ? (
                <img
                  src={urlFor(post.mainImage as Parameters<typeof urlFor>[0])
                    .width(600).height(450).fit("crop").url()}
                  alt={title}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="hatch" />
              )}
            </div>

            {category && <span className="kind">{category}</span>}
            <h3>{title}</h3>
            {excerpt && <p className="dek">{excerpt}</p>}
            <div className="meta">{[post.author?.name, date].filter(Boolean).join(" · ")}</div>
          </Link>
        );
      })}
    </>
  );
}
