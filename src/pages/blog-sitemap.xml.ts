import type { APIRoute } from 'astro';
import { getAllBlogPosts } from '../lib/blog';

export const prerender = false;

/**
 * Publica las noticias servidas dinámicamente, omitidas por el sitemap estático de Astro.
 * @param context Contexto de Astro con URL canónica.
 * @returns Sitemap XML de las noticias publicadas.
 * @throws Error si el proveedor editorial no puede devolver el inventario completo.
 */
export const GET: APIRoute = async ({ site }) => {
  const posts = await getAllBlogPosts();
  const base = site ?? new URL('https://fechitat-website.vercel.app');
  const paths: string[] = [];

  for (const post of posts) {
    if (post.slug?.current) {
      const url = new URL(`/blog/${encodeURIComponent(post.slug.current)}`, base);
      paths.push(`<url><loc>${url.href.replaceAll('&', '&amp;')}</loc></url>`);
    }
  }

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.join('')}</urlset>`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
