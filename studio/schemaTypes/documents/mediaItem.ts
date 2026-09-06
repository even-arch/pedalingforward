import {defineField, defineType} from 'sanity'

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Article URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sourceName',
      title: 'Source Name',
      type: 'string',
    }),
    defineField({
      name: 'sourceLanguage',
      title: 'Language',
      type: 'string',
      options: {list: ['en', 'zh', 'de', 'ja']},
    }),
    defineField({
      name: 'description',
      title: 'Summary / Excerpt',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At (original)',
      type: 'datetime',
    }),
    defineField({
      name: 'fetchedAt',
      title: 'Fetched At',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: '待分析 Raw', value: 'raw'},
          {title: '✅ 收錄 Collected', value: 'collected'},
          {title: '❌ 排除 Dismissed', value: 'dismissed'},
          {title: '🚫 過濾掉 Filtered Out', value: 'filtered_out'},
        ],
      },
      initialValue: 'raw',
    }),
    defineField({
      name: 'relevanceScore',
      title: 'Relevance Score (0–10)',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(10),
    }),
    defineField({
      name: 'relevanceReason',
      title: 'AI Relevance Reason',
      type: 'text',
      rows: 3,
      readOnly: true,
    }),
    defineField({
      name: 'generatedPost',
      title: 'Generated Post',
      type: 'reference',
      to: [{type: 'post'}],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      score: 'relevanceScore',
      source: 'sourceName',
    },
    prepare({title, status, score, source}) {
      const statusIcon = status === 'collected' ? '✅' : status === 'dismissed' ? '❌' : status === 'filtered_out' ? '🚫' : '⏳'
      return {
        title: `${statusIcon} ${title ?? '(untitled)'}`,
        subtitle: `${source ?? ''} · score: ${score ?? '—'}`,
      }
    },
  },
})
