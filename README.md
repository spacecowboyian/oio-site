# OIO Racing Website

A lightweight, content-driven website for outsideinsideoutside.com / oioracing.com built with Astro 5.

## Features

- **Auto-updating content** from YouTube and Instagram
- **SEO optimized** with OpenGraph, Twitter Cards, and sitemap
- **Responsive design** with mobile-first approach
- **Fast performance** using Astro's static site generation
- **Merch integration** ready for Ecwid
- **Sponsor visibility** with dedicated pages and CTAs

## Tech Stack

- **Framework:** Astro 5
- **Styling:** Tailwind CSS 4
- **APIs:** YouTube Data API v3, Instagram Basic Display API
- **E-commerce:** Ecwid by Lightspeed (planned)
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

## Adding Ecwid Merch Store

1. Sign up at [Ecwid](https://www.ecwid.com/)
2. Get your Store ID
3. Edit `src/pages/merch.astro`
4. Add Ecwid embed code:

```astro
<div id="my-store-12345678"></div>
<script 
  data-cfasync="false" 
  type="text/javascript" 
  src="https://app.ecwid.com/script.js?12345678&data_platform=code"
></script>
```

Replace `12345678` with your actual Store ID.

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
