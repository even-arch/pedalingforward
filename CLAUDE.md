# CLAUDE.md — pedalingforward.com

## What this is
Pedaling Forward is an **industry media site**: Taiwanese bicycle components, written for overseas independent bike shops, mechanics and regional distributors. Owned by 律寶實業 / Point Asia Co., Ltd. (Taipei, est. 1983).

**Products and transactions live on Patisco** (patisco.com — a Xinosys SaaS product). This site has no product database, no prices, no cart. Every "see the product / order" action links out to Patisco. This site's job is to make people **see**, **understand**, and **want**.

## Read before working
- `PROJECT_BRIEF.md` — positioning, audience, stack decisions
- `docs/site-map.md` — page structure, content model, layout system, image pipeline, admin (**the main spec**)
- `docs/build-plan.md` — phased build order and checkpoints
- `docs/content-pipeline.md` — where content comes from, what AI may and may not do, and **two changes that supersede the specs above**: `post` needs an `audience` field (supplier / shop / both), and email subscription moves into v1
- `docs/company-history.md` — source for About/history copy. Respect `[公開]` / `[改寫後公開]` / `[內部]` markers; `[內部]` never reaches a page, component or public doc.

## Working rules
1. **Discuss → scaffold → content, in that order. Never all at once.** Even is explicit about this. Follow `docs/build-plan.md` phases and stop at each checkpoint for review.
2. Reply in Traditional Chinese. Code, commit messages and identifiers in English.
3. Even uses voice input, so typos are common and phonetic. "PedalGo"/"綠寶" mean Patisco/律寶. If a term looks like a mis-transcription, ask rather than inventing a new concept.
4. Never commit secrets. API keys live in Vercel env or Sanity `siteSettings`.

## Two structural principles
0. **Language is the audience switch.** The `zh` edition serves Taiwanese suppliers; `en`/`de`/`ja` serve overseas shops. Content need not exist in all four — see `docs/content-pipeline.md`.
1. **Feed first.** The site body is one chronological stream — new products, test reports, industry news, shop-floor stories, shows — all mixed, like a social feed. Not a blog with categories to choose from.
2. **AI aggregates, humans approve.** The same items are collected into brand / category / topic pages. AI classifies and drafts; the admin lets a human fix, reorder and rewrite before publishing.

## Stack
- Next.js App Router + TypeScript (version decision: see `docs/build-plan.md` §0)
- `next-intl`, `localePrefix: 'always'`; locales `en` (default), `zh` (zh-TW), `ja`, `de`; later `fr`, `es`
- Sanity CMS — its own project (not Patisco's); Studio at `/studio`
- Vercel hosting
- No relational DB in v1. Neon only later (CRM, ad performance)
- Admin at `/admin/*`, `x-admin-password` header + `checkAuth()` in `lib/settings.ts`, fail-closed — copy the Patisco pattern
- AI: **Bring Your Own Key**. Keys in Sanity `siteSettings` (per-user pattern: see `pacture_tw/lib/user-keys.ts`). Always preview-then-save; never write to Sanity on a first AI call.
- Telegram for notifications

## Reference repos on this machine
- `~/Claude/Projects/patisco_com` — same author, same conventions. Reuse: project skeleton, `lib/settings.ts`/`checkAuth`, Sanity client + image URL helpers, `next.config.mjs` redirects for legacy Wix URLs, i18n structure, `/admin/compose` preview-then-save flow, `/admin/assets` image library, `match-images`, social publishing (FB Page + IG, incl. container polling and System User → Page token exchange), Telegram notify, UTM generator, `.claude/commands/` project skills.
- `~/Claude/Projects/pacture_tw` — Patisco MCP client (`lib/patisco-mcp.ts`), Meta OAuth/ads skills, BYOK user keys.
- **Do not** port from Patisco: RSS media room, chatbot, CRM, receipts, UX monitor, Tableau.

## Content model (Sanity)
- `post` — one document type for all feed items, distinguished by `type`: `product` · `test` · `industry` · `shopfloor` · `show` · `history`. Multilingual fields, **`audience`** (`supplier` | `shop` | `both` — see `docs/content-pipeline.md` §3; only `both` posts are hreflang alternates of one another), `author` ref, `brands[]` ref, `categories[]` ref, `sourceUrl`, `patiscoUrl`, `facebookPostId`, and **`sections[]`** (see layout system).
- `source` — an RSS or Google News feed being monitored (see `docs/content-pipeline.md` §4)
- `brand` — Taiwanese supplier: logo, intro, categories, Patisco link
- `category` · `topic` · `author` · `asset` metadata · `siteSettings` (singleton)

## Layout system (this is what makes it not look boring)
A post is **not** one blob of rich text. It is `sections[]`, each with a `layout`:
`text` · `image-left` · `image-right` · `image-full` · `gallery` · `quote` (candidates: `spec-table`, `before-after`, `video`).
Rules: layout controls **arrangement only, never color** — color always comes from the brand tokens. Avoid two identical consecutive layouts. All layouts collapse to stacked on mobile. One `<SectionRenderer>` maps `layout` → component.

## Images
Image quality decides whether this site works. Supplier material is mostly white-background catalog shots, which look flat.
- Classify assets as `raw` / `edited` / `lifestyle`
- **Every post needs at least one non-white-background image**
- Set Sanity hotspot/crop once; derive feed card, article header, OG (1200×630) and IG (square) from the same asset
- Asset fields: brand, category, model no., source, usage rights, "used in which posts"

## Brand
Web red `#D5352A` (hover `#A01912`), text black `#1D1D1B`, white. The logo sheet's `#E6332A` / CMYK 0-90-85-0 stays the print value; screen uses the web red — see `public/brand/BRAND.md`. Files and rules in `public/brand/BRAND.md`. Use the SVGs; P mark alone for favicon/avatar. Footer carries the Point Asia logo.

## Editorial rules (any page copy or sample content)
- Voice: an experienced trader speaking plainly — practical judgment, no marketing fluff, admits trends he disagrees with
- Every statistic needs a citable source (`docs/references/`). Never publish a derived number as a fact.
- Names and company names from the history doc must be verified before appearing publicly (its Appendix B)
- Mark de/ja machine translation until reviewed
- No internal family, dispute, revenue or margin details anywhere public
