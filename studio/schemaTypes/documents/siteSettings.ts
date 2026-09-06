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

    // ── Admin ────────────────────────────────────────────────────
    defineField({
      name: 'adminPassword',
      title: 'Admin Password',
      type: 'string',
      group: 'admin',
      description: 'Password for /admin section. Store a strong random string.',
    }),
    defineField({
      name: 'anthropicApiKey',
      title: 'Anthropic API Key',
      type: 'string',
      group: 'admin',
      description: 'Claude API key for AI filtering + article generation. Can also be set via ANTHROPIC_API_KEY env var.',
    }),
    defineField({
      name: 'openaiApiKey',
      title: 'OpenAI API Key',
      type: 'string',
      group: 'admin',
      description: 'OpenAI API key. Can also be set via OPENAI_API_KEY env var.',
    }),
    defineField({
      name: 'aiWritingRules',
      title: 'AI Writing Rules',
      type: 'text',
      rows: 8,
      group: 'admin',
      description: 'Style guide injected into AI article generation prompts.',
      initialValue: `Writing for Pedaling Forward:
- Audience: global bicycle shop owners, distributors, and sourcing managers
- Tone: professional, concise, trade-focused
- Perspective: Taiwan-based bicycle component industry expertise
- Always mention business/supply chain angle, not just product specs
- Use metric units; spell out acronyms on first use
- No marketing fluff; cite sources (linked text, not bare URLs)`,
    }),
  ],
  groups: [
    {name: 'hero', title: 'Hero'},
    {name: 'join', title: 'Join Section'},
    {name: 'content', title: 'Homepage Content'},
    {name: 'admin', title: 'Admin'},
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
