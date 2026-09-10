import { groq } from 'next-sanity'

export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug && status == "published"][0]{
  _id,
  title,
  slug,
  publishedAt,
  postType,
  audience,
  excerpt,
  body,
  editorialNote,
  sourceUrl,
  "mainImage": mainImage{asset->, "alt": alt, "caption": caption},
  "author": author->{name},
  "category": category->{title, slug},
  "relatedBrands": relatedBrands[]->{_id, name},
  "mediaItems": *[_type == "mediaItem" && references(^._id)]{_id, title, url, sourceName}
}`
