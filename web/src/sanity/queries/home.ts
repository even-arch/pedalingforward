import { groq } from 'next-sanity'

export const homepageQuery = groq`{
  "settings": *[_type == "siteSettings"][0]{
    heroEyebrow,
    heroHeadline,
    heroSubtext,
    "stats": stats[]{value, label},
    joinHeadline,
    joinSubtext,
    "featuredPost": featuredPost->{
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      "mainImage": mainImage{asset->, "alt": alt},
      "category": category->{title, slug},
      "author": author->{name}
    },
    "featuredBrands": featuredBrands[]->{_id, name}
  },
  "recentPosts": *[_type == "post"] | order(publishedAt desc)[0...6]{
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    "mainImage": mainImage{asset->, "alt": alt},
    "category": category->{title, slug},
    "author": author->{name}
  },
  "brands": *[_type == "brand"] | order(order asc)[0...12]{
    _id,
    name
  }
}`
