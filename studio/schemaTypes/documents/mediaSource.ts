import {defineField, defineType} from 'sanity'

export const mediaSource = defineType({
  name: 'mediaSource',
  title: 'RSS 來源',
  type: 'document',
  fields: [
    defineField({name: 'name', title: '名稱', type: 'string', validation: (R) => R.required()}),
    defineField({name: 'url', title: 'Feed URL', type: 'url', validation: (R) => R.required()}),
    defineField({
      name: 'kind',
      title: '類型',
      type: 'string',
      options: {
        list: [
          {title: 'RSS / Atom', value: 'rss'},
          {title: 'Google News RSS', value: 'googlenews'},
        ],
        layout: 'radio',
      },
      initialValue: 'rss',
    }),
    defineField({
      name: 'language',
      title: '語言',
      type: 'string',
      options: {list: ['en', 'zh', 'de', 'ja', 'nl', 'fr'], layout: 'radio'},
      initialValue: 'en',
    }),
    defineField({
      name: 'region',
      title: '地區',
      type: 'string',
      description: 'e.g. DE, US, JP, TW, NL',
    }),
    defineField({
      name: 'category',
      title: '分類',
      type: 'string',
      options: {
        list: [
          {title: '貿易 / 業界', value: 'trade'},
          {title: '零件 / 技術評測', value: 'tech'},
          {title: '零售 / 車店', value: 'retail'},
        ],
      },
      initialValue: 'trade',
    }),
    defineField({
      name: 'audience',
      title: '主要受眾',
      type: 'string',
      options: {
        list: [
          {title: '台灣供應商', value: 'supplier'},
          {title: '海外車店', value: 'shop'},
          {title: '兩者', value: 'both'},
        ],
      },
      initialValue: 'both',
    }),
    defineField({name: 'enabled', title: '啟用', type: 'boolean', initialValue: true}),
    defineField({name: 'lastFetchedAt', title: '上次抓取時間', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'url'},
  },
})
