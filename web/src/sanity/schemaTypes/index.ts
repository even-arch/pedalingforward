import {localizedBlockContent, localizedString, localizedText} from './objects/localized'
import {author} from './documents/author'
import {brand} from './documents/brand'
import {category} from './documents/category'
import {imageAsset} from './documents/imageAsset'
import {mediaItem} from './documents/mediaItem'
import {mediaSource} from './documents/mediaSource'
import {post} from './documents/post'
import {siteSettings} from './documents/siteSettings'
import {staticPage} from './documents/staticPage'

export const schemaTypes = [
  // Objects
  localizedString,
  localizedText,
  localizedBlockContent,
  // Documents
  author,
  brand,
  category,
  imageAsset,
  mediaItem,
  mediaSource,
  post,
  siteSettings,
  staticPage,
]
