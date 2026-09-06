import {defineField, defineType} from 'sanity'

export const mediaSource = defineType({
  name: 'mediaSource',
  title: 'RSS 來源',
  type: 'document',
  fields: [
    defineField({name: 'name', title: '名稱', type: 'string', validation: (R) => R.required()}),
    defineField({name: 'url', title: 'RSS Feed URL', type: 'url', validation: (R) => R.required()}),
    defineField({
      name: 'language',
      title: '語言',
      type: 'string',
      options: {list: ['en', 'zh', 'de', 'ja'], layout: 'radio'},
      initialValue: 'en',
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
    defineField({name: 'enabled', title: '啟用', type: 'boolean', initialValue: true}),
    defineField({name: 'lastFetchedAt', title: '上次抓取時間', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'url', media: 'enabled'},
  },
})
