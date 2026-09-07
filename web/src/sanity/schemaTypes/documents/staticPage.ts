import {defineArrayMember, defineField, defineType} from 'sanity'

export const staticPage = defineType({
  name: 'staticPage',
  title: 'Static Page',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Page slug',
      type: 'string',
      description: 'shops | suppliers | distributors | how-it-works | about',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          {title: 'For Bike Shops', value: 'shops'},
          {title: 'For Suppliers',  value: 'suppliers'},
          {title: 'For Distributors', value: 'distributors'},
          {title: 'How It Works',   value: 'how-it-works'},
          {title: 'About',          value: 'about'},
        ],
      },
    }),

    // ── Hero ─────────────────────────────────────────────────────────
    defineField({
      name: 'heroStyle',
      title: 'Hero background',
      type: 'string',
      options: {list: [{title: 'Dark (ink)', value: 'dark'}, {title: 'Red', value: 'red'}]},
      initialValue: 'dark',
      group: 'hero',
    }),
    defineField({name: 'heroEyebrow', title: 'Hero — Eyebrow', type: 'localizedString', group: 'hero'}),
    defineField({name: 'heroHeadline', title: 'Hero — Headline', type: 'localizedString', group: 'hero', validation: (Rule) => Rule.required()}),
    defineField({name: 'heroLead', title: 'Hero — Lead paragraph', type: 'localizedText', group: 'hero'}),
    defineField({name: 'heroBody', title: 'Hero — Body paragraph', type: 'localizedText', group: 'hero'}),

    // ── Spec table ───────────────────────────────────────────────────
    defineField({
      name: 'specItems',
      title: 'Spec table rows',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'localizedString'}),
            defineField({name: 'value', title: 'Value', type: 'localizedString'}),
          ],
          preview: {select: {title: 'label.en', subtitle: 'value.en'}},
        }),
      ],
    }),

    // ── Content sections ─────────────────────────────────────────────
    defineField({
      name: 'sections',
      title: 'Content sections',
      type: 'array',
      group: 'content',
      of: [
        // Benefits grid
        defineArrayMember({
          name: 'benefitsSection',
          title: 'Benefits grid',
          type: 'object',
          fields: [
            defineField({name: 'heading', title: 'Section heading', type: 'localizedString'}),
            defineField({
              name: 'items',
              title: 'Benefit cards',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({name: 'title', type: 'localizedString', title: 'Title'}),
                    defineField({name: 'body',  type: 'localizedText',   title: 'Body'}),
                  ],
                  preview: {select: {title: 'title.en'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'heading.en'}, prepare: ({title}) => ({title: `Benefits: ${title ?? '—'}`})},
        }),

        // Steps list
        defineArrayMember({
          name: 'stepsSection',
          title: 'Steps list',
          type: 'object',
          fields: [
            defineField({name: 'heading', title: 'Section heading', type: 'localizedString'}),
            defineField({
              name: 'items',
              title: 'Steps',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({name: 'title', type: 'localizedString', title: 'Step title'}),
                    defineField({name: 'body',  type: 'localizedText',   title: 'Step description'}),
                  ],
                  preview: {select: {title: 'title.en'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'heading.en'}, prepare: ({title}) => ({title: `Steps: ${title ?? '—'}`})},
        }),

        // Prose (heading + paragraphs)
        defineArrayMember({
          name: 'proseSection',
          title: 'Prose section',
          type: 'object',
          fields: [
            defineField({name: 'heading', title: 'Section heading', type: 'localizedString'}),
            defineField({
              name: 'paragraphs',
              title: 'Paragraphs',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [defineField({name: 'text', type: 'localizedText', title: 'Paragraph'})],
                  preview: {select: {title: 'text.en'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'heading.en'}, prepare: ({title}) => ({title: `Prose: ${title ?? '—'}`})},
        }),

        // CTA block
        defineArrayMember({
          name: 'ctaSection',
          title: 'CTA block',
          type: 'object',
          fields: [
            defineField({name: 'heading',     title: 'Heading',      type: 'localizedString'}),
            defineField({name: 'buttonLabel', title: 'Button label', type: 'localizedString'}),
            defineField({name: 'finePrint',   title: 'Fine print',   type: 'localizedString'}),
            defineField({name: 'href',        title: 'Button href',  type: 'string', initialValue: '#'}),
          ],
          preview: {select: {title: 'heading.en'}, prepare: ({title}) => ({title: `CTA: ${title ?? '—'}`})},
        }),

        // Footer note (small print below steps)
        defineArrayMember({
          name: 'noteSection',
          title: 'Note (small text)',
          type: 'object',
          fields: [
            defineField({name: 'text', title: 'Note text', type: 'localizedText'}),
          ],
          preview: {select: {title: 'text.en'}, prepare: ({title}) => ({title: `Note: ${title ?? '—'}`})},
        }),
      ],
    }),

    // ── SEO ─────────────────────────────────────────────────────────
    defineField({
      name: 'metaTitle',
      title: 'Browser tab title (overrides default)',
      type: 'localizedString',
      group: 'seo',
    }),
  ],

  groups: [
    {name: 'hero',    title: 'Hero'},
    {name: 'content', title: 'Content'},
    {name: 'seo',     title: 'SEO'},
  ],

  preview: {
    select: {title: 'slug'},
    prepare: ({title}) => ({title: `Page: /${title}`}),
  },
})
