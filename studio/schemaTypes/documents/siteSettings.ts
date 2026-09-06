import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
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
      description: 'Password for /admin section.',
    }),
    defineField({
      name: 'anthropicApiKey',
      title: 'Anthropic API Key',
      type: 'string',
      group: 'admin',
      description: 'Claude API key. Also readable from ANTHROPIC_API_KEY env var (takes priority).',
    }),
    defineField({
      name: 'openaiApiKey',
      title: 'OpenAI API Key',
      type: 'string',
      group: 'admin',
      description: 'OpenAI API key. Also readable from OPENAI_API_KEY env var (takes priority).',
    }),
    defineField({
      name: 'firecrawlApiKey',
      title: 'Firecrawl API Key',
      type: 'string',
      group: 'admin',
      description: 'For fetching full article text. Also from FIRECRAWL_API_KEY env var.',
    }),
    defineField({
      name: 'telegramBotToken',
      title: 'Telegram Bot Token',
      type: 'string',
      group: 'admin',
      description: 'Bot token for draft-ready notifications.',
    }),
    defineField({
      name: 'telegramChatId',
      title: 'Telegram Chat ID',
      type: 'string',
      group: 'admin',
      description: 'Chat or channel ID to receive notifications.',
    }),
    defineField({
      name: 'aiWritingRules',
      title: 'AI Writing Rules',
      type: 'text',
      rows: 8,
      group: 'admin',
      description: 'Style guide injected into AI generation prompts.',
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
