import {localizedBlockContent, localizedString, localizedText} from './objects/localized'
import {author} from './documents/author'
import {brand} from './documents/brand'
import {category} from './documents/category'
import {post} from './documents/post'
import {siteSettings} from './documents/siteSettings'

export const schemaTypes = [
  // Objects
  localizedString,
  localizedText,
  localizedBlockContent,
  // Documents
  author,
  brand,
  category,
  post,
  siteSettings,
]
