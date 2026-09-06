import {defineArrayMember, defineField, defineType} from 'sanity'

const blockContent = [
  defineArrayMember({
    type: 'block',
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'Heading 2', value: 'h2'},
      {title: 'Heading 3', value: 'h3'},
      {title: 'Quote', value: 'blockquote'},
    ],
    marks: {
      decorators: [
        {title: 'Bold', value: 'strong'},
        {title: 'Italic', value: 'em'},
      ],
      annotations: [
        defineArrayMember({
          name: 'link',
          type: 'object',
          fields: [
            defineField({name: 'href', type: 'url', title: 'URL'}),
            defineField({
              name: 'blank',
              type: 'boolean',
              title: 'Open in new tab',
              initialValue: true,
            }),
          ],
        }),
      ],
    },
  }),
  defineArrayMember({
    type: 'image',
    options: {hotspot: true},
    fields: [
      defineField({name: 'alt', type: 'string', title: 'Alt text'}),
      defineField({name: 'caption', type: 'string', title: 'Caption'}),
    ],
  }),
]

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized String',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({name: 'en', title: 'English', type: 'string'}),
    defineField({name: 'zh', title: '中文', type: 'string'}),
    defineField({name: 'ja', title: '日本語', type: 'string'}),
    defineField({name: 'de', title: 'Deutsch', type: 'string'}),
  ],
})

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Localized Text',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({name: 'en', title: 'English', type: 'text', rows: 3}),
    defineField({name: 'zh', title: '中文', type: 'text', rows: 3}),
    defineField({name: 'ja', title: '日本語', type: 'text', rows: 3}),
    defineField({name: 'de', title: 'Deutsch', type: 'text', rows: 3}),
  ],
})

export const localizedBlockContent = defineType({
  name: 'localizedBlockContent',
  title: 'Localized Block Content',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({name: 'en', title: 'English', type: 'array', of: blockContent}),
    defineField({name: 'zh', title: '中文', type: 'array', of: blockContent}),
    defineField({name: 'ja', title: '日本語', type: 'array', of: blockContent}),
    defineField({name: 'de', title: 'Deutsch', type: 'array', of: blockContent}),
  ],
})
