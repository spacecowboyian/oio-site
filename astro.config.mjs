// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TEMPORARY — preview branch only. Serves the build at the project-pages URL
  // (spacecowboyian.github.io/oio-site) so the site can be looked at before the
  // oioracing.com DNS cutover. public/CNAME is deleted on this branch for the
  // same reason: with a custom domain set, Pages refuses to answer on github.io.
  // Revert both before merging anything to master.
  site: 'https://spacecowboyian.github.io',
  base: '/oio-site',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});