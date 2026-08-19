# OIO Racing Website

A lightweight, content-driven website for outsideinsideoutside.com / oioracing.com built with Astro 6.

## Features

- **Auto-updating content** from YouTube and Instagram
- **SEO optimized** with OpenGraph, Twitter Cards, and sitemap
- **Responsive design** with mobile-first approach
- **Fast performance** using Astro's static site generation
- **Merch store** generated from the Spreadshirt Public Shop API at build time
- **Sponsor visibility** with dedicated pages and CTAs

## Tech Stack

- **Framework:** Astro 6
- **Styling:** Tailwind CSS 4
- **APIs:** YouTube Data API v3, Instagram Basic Display API
- **E-commerce:** Spreadshop / Spreadshirt Public Shop API
- **Hosting:** Vercel or Netlify (recommended)

## Quick Start

### Prerequisites

- Node.js 18+ (20+ recommended)
- pnpm (or npm)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Add your API credentials:

```env
# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here

# Instagram Basic Display API
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
```

### 2. Getting API Keys

#### YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials (API Key)
5. Find your channel ID: Visit `youtube.com/@oioracing` and view page source, search for `channelId`

#### Instagram Basic Display API

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and add Instagram Basic Display
3. Generate a long-lived access token
4. Add token to `.env`

### 3. Site Configuration

Update `astro.config.mjs` with your domain:

```js
export default defineConfig({
  site: 'https://outsideinsideoutside.com',
  // or 'https://oioracing.com'
});
```

## Project Structure

```
/
├── public/
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro       # Main layout with nav/footer
│   ├── lib/
│   │   ├── youtube.ts             # YouTube API integration
│   │   └── instagram.ts           # Instagram API integration
│   ├── pages/
│   │   ├── index.astro            # Homepage
│   │   ├── videos.astro           # Videos page
│   │   ├── schedule.astro         # Schedule page
│   │   ├── sponsors.astro         # Sponsors page
│   │   ├── merch.astro            # Merch/store page
│   │   └── contact.astro          # Contact page
│   └── styles/
│       └── global.css             # Tailwind imports
└── astro.config.mjs
```

## Merch store

The store is generated at build time from the Spreadshirt Public Shop API
(Spreadshop `477761`). Spreadshirt stays the backend for product data, cart,
checkout, production and shipping; this site is the brand and browsing layer.

```bash
pnpm sync:merch     # rewrites src/data/merch/catalog.json
```

Needs `SPREADSHIRT_API_KEY` in `.env` (see `.env.example`). The key is read only
by the sync script at build time and never reaches the browser or the bundle.

### How it is curated

| File | What it decides |
|---|---|
| `src/data/merch/lineup.json` | The products OIO sells — one design on one blank |
| `src/data/merch/overrides.json` | Which designs are published, and their OIO name, blurb and collection |
| `src/data/merch/catalog.json` | Generated. Do not hand-edit |

Spreadshop lists 120+ printable blanks per design. Merchandising all of them
reads as a catalogue dump, so the lineup is a short curated list; everything
else stays purchasable on Spreadshop but is not surfaced here. Designs default
to unpublished, and overrides are keyed by `ideaId` so a rename in the Partner
Area cannot reshuffle the storefront.

### Two things that will bite you

- **Ink colour is fixed per sellable**, encoded as `CxRRGGBB` in `vpKey`. Garment
  colour is selectable; print colour is not. "White design on a black shirt" is a
  different blank, not a colour pick — use `lineup.byDesign[ideaId].swap`.
- **Size runs vary per colourway.** The same blank stocks different sizes in
  different colours, so the sync stores a `sizesByAppearance` matrix and the
  product page re-derives sizes whenever the colour changes.

Checkout hands off to Spreadshop via `<slug>-A<ideaId>` deep links; any slug
resolves and redirects to the canonical one.

## Brand tokens

`src/styles/apex.css` is **generated** from the Apex brand tokens that live in
the sibling repo [`spacecowboyian/oio-apex`](https://github.com/spacecowboyian/oio-apex)
(`packages/tokens/tokens.json`) — the single authority for OIO colour, type
scale and shape. Do not hand-edit the CSS; change the token upstream and
regenerate:

```bash
npm run tokens:sync    # rewrite src/styles/apex.css from oio-apex
npm run tokens:check   # exit 1 if it has drifted from upstream
```

The sync expects `oio-apex` cloned beside this repo; set `OIO_APEX` to point
elsewhere. The generated CSS is committed on purpose — the Pages deploy builds
from a checkout of this repo alone and never sees oio-apex, so only the sync
needs the tokens repo, not the build.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify

1. Push code to GitHub
2. Import project in [Netlify](https://www.netlify.com/)
3. Build command: `pnpm build`
4. Publish directory: `dist`
5. Add environment variables in Netlify dashboard
6. Deploy

### Daily Rebuilds

Both Vercel and Netlify support scheduled builds to keep YouTube/Instagram content fresh.

**Vercel:** Use Vercel Cron Jobs
**Netlify:** Use Build Hooks with external cron service

## Development

```bash
# Start dev server with hot reload
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Type check
pnpm astro check
```

## Customization

### Colors

Edit Tailwind colors in `src/styles/global.css` or use Tailwind's utility classes directly.

Current theme: Dark (zinc palette)

### Content

- **Homepage hero:** Edit `src/pages/index.astro`
- **Navigation:** Edit `src/layouts/BaseLayout.astro`
- **Footer:** Edit `src/layouts/BaseLayout.astro`

### Mock Data

When API credentials aren't configured, the site uses mock data for development. See:
- `src/lib/youtube.ts` - `getMockVideos()`
- `src/lib/instagram.ts` - `getMockPosts()`

## Performance

Built site achieves:
- ✓ Lighthouse score 90+ (all categories)
- ✓ Page load time <2 seconds
- ✓ Mobile-responsive across all breakpoints
- ✓ Optimized images with lazy loading
- ✓ Minimal JavaScript bundle

## SEO Features

- ✓ OpenGraph meta tags
- ✓ Twitter Card metadata
- ✓ Auto-generated sitemap
- ✓ robots.txt configured
- ✓ Semantic HTML5 structure
- ✓ Descriptive alt text
- ✓ Fast Core Web Vitals

## License

Copyright © 2026 OIO Racing. All rights reserved.

## Support

For issues or questions:
- Check the [Astro documentation](https://docs.astro.build/)
- Review API documentation for [YouTube](https://developers.google.com/youtube/v3) and [Instagram](https://developers.facebook.com/docs/instagram-basic-display-api)
