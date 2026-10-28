import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  getWordPressBlogCount,
  getWordPressBlogPostBySlug,
  getWordPressBlogPosts,
  getWordPressFeaturedPosts,
  mapWordPressPost,
  toPlainText,
} from '../src/lib/wordpress.ts';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.WORDPRESS_URL;
const entry = {
  id: 42,
  slug: 'noticia-fechitat',
  date: '2026-09-29T11:00:00',
  date_gmt: '2026-09-29T14:00:00',
  title: { rendered: 'Chile &amp; Taekwon-Do' },
  excerpt: { rendered: '<p>Una noticia &uacute;til.</p>' },
  content: { rendered: '<p>Contenido publicado.</p>' },
  meta: { fechitat_author_credit: 'FECHITAT' },
  sticky: true,
  _embedded: {
    'wp:featuredmedia': [{ source_url: 'https://cms.example.test/foto.jpg', alt_text: 'Equipo' }],
    'wp:term': [[{ taxonomy: 'category', slug: 'noticias' }]],
  },
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.WORDPRESS_URL;
  else process.env.WORDPRESS_URL = originalUrl;
});

test('convierte HTML del CMS a texto plano sin convertir etiquetas en HTML público', () => {
  assert.equal(toPlainText('<p>Chile &amp; &lt;script&gt; &#x1F94B;</p>'), 'Chile & <script> 🥋');
});

test('mapea fecha UTC, firma, imagen y categorías de la noticia', () => {
  assert.deepEqual(mapWordPressPost(entry), {
    _id: 'wp-42',
    titulo: 'Chile & Taekwon-Do',
    slug: { current: 'noticia-fechitat' },
    fecha: '2026-09-29T14:00:00Z',
    autor: 'FECHITAT',
    extracto: 'Una noticia útil.',
    categorias: ['noticias'],
    imagenUrl: 'https://cms.example.test/foto.jpg',
    imagenAlt: 'Equipo',
    contenidoHtml: '<p>Contenido publicado.</p>',
    destacado: true,
  });
});

test('conserva las etiquetas editoriales como palabras clave de búsqueda, no como badges adicionales', () => {
  const post = mapWordPressPost({ ...entry, _embedded: {
    ...entry._embedded,
    'wp:term': [[{ taxonomy: 'category', slug: 'tecnica' }, { taxonomy: 'post_tag', slug: 'autoproteccion', name: 'Autoprotección' }]],
  } });
  assert.deepEqual(post.categorias, ['tecnica']);
  assert.deepEqual(post.palabrasClave, ['Autoprotección']);
});

test('consulta la paginación, el artículo y las noticias fijadas sin credenciales', async () => {
  process.env.WORDPRESS_URL = 'https://cms.example.test';
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return new Response(JSON.stringify([entry]), {
      headers: { 'X-WP-Total': '1', 'Content-Type': 'application/json' },
    });
  };

  assert.equal((await getWordPressBlogPosts(1, 12))[0]?.titulo, 'Chile & Taekwon-Do');
  assert.equal(await getWordPressBlogCount(), 1);
  assert.equal((await getWordPressBlogPostBySlug('noticia-fechitat'))?.slug.current, 'noticia-fechitat');
  assert.equal((await getWordPressFeaturedPosts()).length, 1);
  assert.equal(urls.length, 4);
  assert.ok(urls.every((url) => url.startsWith('https://cms.example.test/wp-json/wp/v2/posts?')));
  assert.ok(urls[2]?.includes('slug=noticia-fechitat'));
  assert.ok(urls[3]?.includes('sticky=true'));
});

test('informa errores de WordPress en lugar de ocultarlos', async () => {
  process.env.WORDPRESS_URL = 'https://cms.example.test';
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  await assert.rejects(getWordPressBlogPosts(), /HTTP 503/);
  await assert.rejects(getWordPressBlogPosts(0), /paginación/);
  globalThis.fetch = async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(getWordPressBlogCount(), /total válido/);
});
