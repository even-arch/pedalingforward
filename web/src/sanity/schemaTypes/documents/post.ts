import {defineArrayMember, defineField, defineType} from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      description: 'English title is used for slug generation and SEO fallback',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title.en', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({
      name: 'targetAudience',
      title: 'Target Audience',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Bike Shops', value: 'shops'},
          {title: 'Suppliers', value: 'suppliers'},
          {title: 'Distributors', value: 'distributors'},
        ],
        layout: 'grid',
      },
      description: 'Leave empty to show to all audiences',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'localizedString',
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'localizedString',
        }),
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localizedText',
      description: 'Short summary shown on cards and in search results (1–3 sentences)',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'localizedBlockContent',
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      description: 'Pin as the lead article. Overridden by the manual pin in Site Settings.',
      initialValue: false,
    }),
    defineField({
      name: 'relatedBrands',
      title: 'Related Brands',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'brand'}]})],
      description: 'Taiwanese brands featured or discussed in this article',
    }),
  ],
  orderings: [
    {
      title: 'Published Date, New → Old',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title.en',
      author: 'author.name',
      media: 'mainImage',
      publishedAt: 'publishedAt',
    },
    prepare({title, author, media, publishedAt}) {
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
        : 'Draft'
      return {
        title: title ?? 'Untitled',
        subtitle: [author, date].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
