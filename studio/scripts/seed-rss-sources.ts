import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})

const SOURCES = [
  {
    _type: 'mediaSource',
    name: 'Bike Europe — All Updates',
    url: 'https://cms.bike-eu.com/rss_feed/news-marketing',
    language: 'en',
    category: 'trade',
    enabled: true,
  },
  {
    _type: 'mediaSource',
    name: 'Bike Europe — Products & Innovations',
    url: 'https://cms.bike-eu.com/rss_feed/products-and-innovations',
    language: 'en',
    category: 'tech',
    enabled: true,
  },
  {
    _type: 'mediaSource',
    name: 'Bike Europe — 中文版',
    url: 'https://cms.bike-eu.com/rss_feed/chinees',
    language: 'zh',
    category: 'trade',
    enabled: true,
  },
  {
    _type: 'mediaSource',
    name: 'Cycling Industry News',
    url: 'https://cyclingindustry.news/feed',
    language: 'en',
    category: 'trade',
    enabled: true,
  },
  {
    _type: 'mediaSource',
    name: 'Bicycle Retailer & Industry News',
    url: 'https://www.bicycleretailer.com/rss.xml',
    language: 'en',
    category: 'retail',
    enabled: true,
  },
  {
    _type: 'mediaSource',
    name: 'BikeBiz',
    url: 'https://bikebiz.com/feed',
    language: 'en',
    category: 'retail',
    enabled: true,
  },
  {
    _type: 'mediaSource',
    name: 'Bikerumor',
    url: 'https://www.bikerumor.com/feed',
    language: 'en',
    category: 'tech',
    enabled: true,
  },
  {
    _type: 'mediaSource',
    name: 'Velomotion (DE)',
    url: 'https://velomotion.net/feed',
    language: 'de',
    category: 'tech',
    enabled: true,
  },
]

async function main() {
  console.log(`Seeding ${SOURCES.length} RSS sources into Sanity...`)
  for (const source of SOURCES) {
    const doc = await client.create(source)
    console.log(`✓ ${source.name} (${doc._id})`)
  }
  console.log('Done.')
}

main().catch(console.error)
