import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Singleton — studio structure in sanity.config.ts locks it to a fixed
  // documentId and the templates filter hides "Create new".
  fields: [
    // ── Hero / Masthead ──────────────────────────────────────────
    defineField({
      name: 'heroEyebrow',
      title: 'Hero — Eyebrow',
      type: 'string',
      group: 'hero',
      description: 'Small text above headline, e.g. "Est. 1983 · Point Asia Co., Ltd."',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero — Headline',
      type: 'localizedString',
      group: 'hero',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtext',
      title: 'Hero — Subtext',
      type: 'localizedText',
      group: 'hero',
    }),

    // ── Stats ────────────────────────────────────────────────────
    defineField({
      name: 'stats',
      title: 'Hero — Stats',
      type: 'array',
      group: 'hero',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g. "200+" or "40 yr"'}),
            defineField({name: 'label', title: 'Label', type: 'localizedString'}),
          ],
          preview: {
            select: {title: 'value', subtitle: 'label.en'},
          },
        }),
      ],
      validation: (Rule) => Rule.max(4),
    }),

    // ── Join Section ─────────────────────────────────────────────
    defineField({
      name: 'joinHeadline',
      title: 'Join — Headline',
      type: 'localizedString',
      group: 'join',
    }),
    defineField({
      name: 'joinSubtext',
      title: 'Join — Subtext',
      type: 'localizedText',
      group: 'join',
    }),

    // ── Homepage Content ─────────────────────────────────────────
    defineField({
      name: 'featuredPost',
      title: 'Featured Post (Lead Article)',
      type: 'reference',
      to: [{type: 'post'}],
      group: 'content',
      description: 'Manually pin a post as the homepage lead article. Falls back to most recent post.',
    }),
    defineField({
      name: 'featuredBrands',
      title: 'Featured Brands',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'brand'}]})],
      group: 'content',
      description: 'Brands shown in the homepage brand strip. Order matters.',
      validation: (Rule) => Rule.max(12),
    }),
  ],
  groups: [
    {name: 'hero', title: 'Hero'},
    {name: 'join', title: 'Join Section'},
    {name: 'content', title: 'Homepage Content'},
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
