import {defineArrayMember, defineField, defineType} from 'sanity'

export const imageAsset = defineType({
  name: 'imageAsset',
  title: 'Image Asset',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Short label, e.g. "Shimano Dura-Ace RD studio white"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Set hotspot/crop once — card, article header, OG, and IG are all derived from this',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'localizedString',
    }),
    defineField({
      name: 'quality',
      title: 'Quality',
      type: 'string',
      options: {
        list: [
          {title: '📷 Raw — unretouched supplier shot', value: 'raw'},
          {title: '✂️ Edited — clipped or retouched', value: 'edited'},
          {title: '🏞 Lifestyle — in-use, non-white background', value: 'lifestyle'},
        ],
        layout: 'radio',
      },
      initialValue: 'raw',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      description: 'Same vocabulary as post mediaTags — brand, topic, tech terms. Used for tag-based matching.',
    }),
    defineField({
      name: 'brands',
      title: 'Related Brands',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'brand'}]})],
    }),
    defineField({
      name: 'modelNo',
      title: 'Model No.',
      type: 'string',
    }),
    defineField({
      name: 'pixabayId',
      title: 'Pixabay ID',
      type: 'string',
      description: 'Set automatically when imported from Pixabay. Used to prevent duplicate fetches.',
      readOnly: true,
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Where this image came from (e.g. "supplier press kit", "Taipei Cycle 2025", "editorial shoot")',
    }),
    defineField({
      name: 'usageRights',
      title: 'Usage Rights',
      type: 'string',
      options: {
        list: [
          {title: '✅ Owned / In-house', value: 'owned'},
          {title: '📝 Licensed', value: 'licensed'},
          {title: '📰 Editorial use only', value: 'editorial'},
          {title: '🛒 Stock photo', value: 'stock'},
        ],
        layout: 'radio',
      },
      initialValue: 'owned',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'createdAtDesc',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      quality: 'quality',
      usageRights: 'usageRights',
    },
    prepare({title, media, quality, usageRights}) {
      const qualityIcon = quality === 'lifestyle' ? '🏞' : quality === 'edited' ? '✂️' : '📷'
      const rightsIcon = usageRights === 'editorial' ? '📰' : usageRights === 'stock' ? '🛒' : '✅'
      return {
        title: title ?? 'Untitled',
        subtitle: `${qualityIcon} ${quality ?? ''}  ${rightsIcon} ${usageRights ?? ''}`,
        media,
      }
    },
  },
})
