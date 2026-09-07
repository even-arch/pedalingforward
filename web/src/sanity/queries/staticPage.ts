import { groq } from 'next-sanity'

export const staticPageQuery = groq`
  *[_type == "staticPage" && slug == $slug][0]{
    slug,
    heroStyle,
    heroEyebrow,
    heroHeadline,
    heroLead,
    heroBody,
    "specItems": specItems[]{_key, label, value},
    "sections": sections[]{
      _key,
      _type,
      heading,
      "items": items[]{_key, title, body},
      "paragraphs": paragraphs[]{_key, text},
      text,
      buttonLabel,
      finePrint,
      href
    },
    metaTitle
  }
`
