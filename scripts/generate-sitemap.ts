import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { SITE_URL } from '../src/utils/config';

const staticRoutes = [
  '/',
  '/hasu-music',
  '/hasu-music/intro-don',
  '/songs',
  '/setlist-prediction',
  '/setlist-prediction/builder',
  // '/setlist-prediction/marking', // Marking seems dynamic or requires state? Assuming static for now.
  // '/setlist-prediction/view', // View usually takes an ID. If it's a base page, keep it.
  '/share'
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes()
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route === '/' ? '' : route}</loc>
    <chan
  g
  efreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

const outputPath = resolve(__dirname, '../dist/client/sitemap.xml');
writeFileSync(outputPath, sitemap);

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`;

const robotsPath = resolve(__dirname, '../dist/client/robots.txt');
writeFileSync(robotsPath, robotsTxt);

console.log(`Sitemap generated at ${outputPath}`);
console.log(`Robots.txt generated at ${robotsPath}`);
