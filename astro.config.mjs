// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://fechitat-website.vercel.app',
  output: 'server',
  adapter: vercel(),
  image: {
    // Patrones remotos permitidos para <Image> de astro:assets
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Imágenes servidas por el CDN de Sanity
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      customSitemaps: ['https://fechitat-website.vercel.app/blog-sitemap.xml'],
      filter: (page) =>
        ![
          '/blog', '/federacion/documentos', '/recursos/formacion', '/recursos/herramientas',
          '/recursos/formacion/tuls', '/recursos/formacion/material-estudio', '/estudio', '/examen', '/tools',
        ].includes(new URL(page).pathname.replace(/\/$/, '')) &&
        !page.includes('/admin/') &&
        !page.includes('/blog/pagina/') &&
        !page.includes('/material-de-estudio/') &&
        !page.includes('/material/programa-examen/'),
    }),
  ],
});