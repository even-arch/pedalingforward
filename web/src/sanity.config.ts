'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from '@/sanity/schemaTypes'

const SINGLETON_TYPES = ['siteSettings'] as const

export default defineConfig({
  name: 'default',
  title: 'Pedaling Forward',

  projectId: 'hu5uwlku',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings'),
              ),
            S.divider(),
            S.documentTypeListItem('post').title('Posts'),
            S.documentTypeListItem('category').title('Categories'),
            S.documentTypeListItem('author').title('Authors'),
            S.documentTypeListItem('brand').title('Brands'),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) =>
      prev.filter(
        ({ schemaType }) =>
          !SINGLETON_TYPES.includes(schemaType as (typeof SINGLETON_TYPES)[number]),
      ),
  },
})
