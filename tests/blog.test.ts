import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { getAllBlogPosts, getBlogPostBySlug } from '../src/lib/blog.ts';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.WORDPRESS_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.WORDPRESS_URL;
  else process.env.WORDPRESS_URL = originalUrl;
});

test('carga todo el inventario de WordPress en páginas de hasta 100, sin truncar el catálogo', async () => {
  process.env.WORDPRESS_URL = 'https://cms.test';
  const sizes: number[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const perPage = Number(url.searchParams.get('per_page'));
    if (perPage === 1) return new Response('[]', { headers: { 'X-WP-Total': '205' } });
    sizes.push(perPage);
    const start = (Number(url.searchParams.get('page')) - 1) * perPage;
    const posts = Array.from({ length: Math.min(perPage, 205 - start) }, (_, index) => ({
      id: start + index,
      slug: `articulo-${start + index}`,
      date: '2026-01-01T10:00:00', date_gmt: '2026-01-01T10:00:00',
      title: { rendered: `Artículo ${start + index}` }, excerpt: { rendered: 'Descripción' }, content: { rendered: '<p>Contenido</p>' }, sticky: false,
    }));
    return Response.json(posts);
  };
  const posts = await getAllBlogPosts();
  assert.equal(posts.length, 205);
  assert.equal(new Set(posts.map((post) => post._id)).size, 205);
  assert.equal(posts.at(-1)?.slug.current, 'articulo-204');
  assert.deepEqual(sizes, [100, 100, 100]);
});

test('las páginas individuales consultan el mismo proveedor editorial que el catálogo', async () => {
  process.env.WORDPRESS_URL = 'https://cms.test';
  globalThis.fetch = async (input) => {
    assert.equal(new URL(String(input)).searchParams.get('slug'), 'articulo-wordpress');
    return Response.json([{
      id: 1, slug: 'articulo-wordpress', date: '2026-01-01T10:00:00', date_gmt: null,
      title: { rendered: 'Artículo WordPress' }, excerpt: { rendered: 'Extracto' }, content: { rendered: '<p>Texto completo</p>' }, sticky: false,
    }]);
  };
  assert.equal((await getBlogPostBySlug('articulo-wordpress'))?.contenidoHtml, '<p>Texto completo</p>');
});

test('propaga errores editoriales en lugar de mostrar un catálogo incompleto como válido', async () => {
  process.env.WORDPRESS_URL = 'https://cms.test';
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  await assert.rejects(getAllBlogPosts(), /HTTP 503/);
});
