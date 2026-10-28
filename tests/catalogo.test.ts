import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  RESOURCE_CATEGORIES,
  RESOURCE_FORMATS,
  articleToResource,
  documentToResource,
  getCatalogCategories,
  getCatalogUrl,
  getResourceSearchText,
  matchesResource,
  readCatalogFilters,
  type CatalogFilters,
} from '../src/features/recursos/catalogo.ts';
import { LOCAL_RESOURCES } from '../src/features/recursos/recursos.ts';
import type { BlogPost } from '../src/lib/wordpress.ts';

const post: BlogPost = {
  _id: 'article-1',
  titulo: 'Principios de la defensa personal',
  slug: { current: 'defensa-personal-taekwondo' },
  extracto: 'Una guía de los principios técnicos del Taekwon-Do ITF.',
  fecha: '2025-06-15T10:00:00Z',
  autor: 'Comisión Técnica',
  categorias: ['tecnica', 'noticias'],
  palabrasClave: ['autoprotección'],
  destacado: true,
};
const emptyFilters: CatalogFilters = { query: '', category: '' };

test('conserva los cuatro recursos originales, sus destinos y formatos sin fotos de relleno', () => {
  assert.deepEqual(LOCAL_RESOURCES.map((resource) => resource.id), ['programa-examen', 'terminologia', 'sonkal-itf', 'temporizador-formas']);
  assert.equal(LOCAL_RESOURCES[0]?.href, '/recursos/formacion/programa-examen');
  assert.equal(LOCAL_RESOURCES[1]?.href, '/recursos/formacion/terminologia');
  assert.ok(LOCAL_RESOURCES[2]?.href.startsWith('https://play.google.com/'));
  assert.equal(LOCAL_RESOURCES[3]?.href, 'https://tools-sigma-olive.vercel.app/temporizador');
  assert.deepEqual(LOCAL_RESOURCES.map((resource) => resource.format), ['guia', 'guia', 'herramienta', 'herramienta']);
  assert.ok(LOCAL_RESOURCES.every((resource) => !resource.image && resource.category.id));
});

test('normaliza artículos sin cambiar su URL, fecha, firma ni palabras clave y expone una sola categoría', () => {
  const resource = articleToResource(post);
  assert.equal(resource.href, '/blog/defensa-personal-taekwondo');
  assert.equal(resource.title, post.titulo);
  assert.equal(resource.description, post.extracto);
  assert.equal(resource.publishedAt, post.fecha);
  assert.equal(resource.author, post.autor);
  assert.deepEqual(resource.keywords, ['autoprotección']);
  assert.deepEqual(resource.category, { id: 'tecnica', label: 'Técnica' });
  assert.equal(resource.format, 'articulo');
  assert.equal(resource.image, undefined);
});

test('mantiene solo portadas editoriales reales y su texto alternativo', () => {
  assert.deepEqual(articleToResource({ ...post, imagenUrl: 'https://cms.test/foto.webp', imagenAlt: 'Práctica técnica' }).image,
    { src: 'https://cms.test/foto.webp', alt: 'Práctica técnica' });
});

test('omite Eventos sin ocultar artículos históricos y unifica Árbitros como Arbitraje', () => {
  assert.equal(articleToResource({ ...post, categorias: ['eventos', 'noticias'] }).category.id, 'noticias');
  assert.equal(articleToResource({ ...post, categorias: ['eventos'] }).category.id, 'noticias');
  assert.equal(articleToResource({ ...post, categorias: [] }).category.id, 'noticias');
  assert.equal(articleToResource({ ...post, categorias: ['arbitros', 'teoria'] }).category.id, 'arbitraje');
  assert.ok(!RESOURCE_CATEGORIES.some((category) => category.id === 'eventos'));
});

test('extiende categorías desde el CMS sin duplicar ni descartar etiquetas históricas', () => {
  const resources = [articleToResource({ ...post, categorias: ['historia'] }), articleToResource({ ...post, categorias: ['entrevistas'] })];
  const categories = getCatalogCategories([...LOCAL_RESOURCES, ...resources]);
  assert.equal(categories.filter((category) => category.id === 'teoria').length, 1);
  assert.equal(categories.find((category) => category.id === 'historia')?.label, 'Historia');
  assert.equal(categories.find((category) => category.id === 'entrevistas')?.label, 'Entrevistas');
  assert.ok(categories.some((category) => category.id === 'documentos-oficiales'));
});

test('combina búsqueda por título, descripción, palabras clave y categoría, ignorando tildes', () => {
  const resource = articleToResource(post);
  const index = { category: resource.category.id, format: resource.format, searchText: getResourceSearchText(resource) };
  for (const query of ['DEFENSA PERSONAL', 'principios tecnicos', 'autoproteccion', 'tecnica']) {
    assert.ok(matchesResource(index, { ...emptyFilters, query }), query);
  }
  assert.ok(matchesResource(index, { query: 'defensa', category: 'tecnica' }));
  assert.ok(!matchesResource(index, { query: 'defensa', category: 'formas' }));
  assert.ok(!matchesResource(index, { ...emptyFilters, query: 'defensa inexistente' }));
});

test('ofrece los cuatro tipos de contenido solicitados en orden estable', () => {
  assert.deepEqual(RESOURCE_FORMATS.map(({ id, label }) => [id, label]), [
    ['herramienta', 'Herramientas'], ['guia', 'Guías'], ['documento', 'Documentos'], ['articulo', 'Artículos'],
  ]);
});

test('combina búsqueda y tipo de contenido sin perder recursos ni categorías temáticas históricas', () => {
  const resources = [
    ...LOCAL_RESOURCES,
    articleToResource(post),
    documentToResource({ _id: 'reglamento', titulo: 'Reglamento oficial', descripcion: 'Normas de competición' }),
  ];
  const indexes = resources.map((resource) => ({
    category: resource.category.id, format: resource.format, searchText: getResourceSearchText(resource),
  }));
  const count = (filters: CatalogFilters): number => indexes.filter((index) => matchesResource(index, filters)).length;

  assert.equal(count(emptyFilters), resources.length);
  for (const [category, expected] of [['guia', 2], ['herramienta', 2], ['articulo', 1], ['documento', 1]] as const) {
    assert.equal(count({ query: '', category }), expected, category);
  }
  assert.equal(count({ query: 'terminologia', category: 'guia' }), 1);
  assert.equal(count({ query: 'formas', category: 'herramienta' }), 2);
  assert.equal(count({ query: 'PRINCIPIOS TECNICOS', category: 'articulo' }), 1);
  assert.equal(count({ query: 'competicion', category: 'documento' }), 1);
  assert.equal(count({ query: 'terminologia', category: 'herramienta' }), 0);
  assert.equal(count({ query: 'inexistente', category: '' }), 0);
  assert.equal(count({ query: '', category: 'desconocida' }), 0);
  assert.equal(count({ query: '', category: 'formas' }), 2);
  assert.equal(count({ query: 'estudio', category: 'teoria' }), 2);
  assert.equal(matchesResource({ category: 'guia', format: 'articulo', searchText: 'técnica' }, { query: '', category: 'guia' }), false);
});

test('documentos conservan descarga y metadatos de vigencia en la nueva categoría oficial', () => {
  const resource = documentToResource({
    _id: 'document-1', titulo: 'Reglamento', descripcion: 'Reglamento vigente.', tipo: 'reglamento',
    archivoUrl: 'https://cms.test/reglamento.pdf', fechaPublicacion: '2026-01-01', fechaVigencia: '2026-02-01',
    version: '2.0', estado: 'archivado', comisionNombre: 'Comisión de Disciplina',
  });
  assert.equal(resource.href, 'https://cms.test/reglamento.pdf');
  assert.equal(resource.format, 'documento');
  assert.equal(resource.category.id, 'documentos-oficiales');
  assert.equal(resource.publishedAt, '2026-01-01');
  assert.equal(resource.author, 'Comisión de Disciplina');
  assert.deepEqual(resource.details, ['Versión 2.0', 'Archivado', 'Vigencia desde 2026-02-01']);
  assert.equal(resource.actionLabel, 'Descargar documento');
  assert.equal(documentToResource({ _id: 'missing-file', titulo: 'Documento sin archivo' }).href, '/recursos/documentos-oficiales');
});

test('persiste filtros combinados en la URL, permite limpiarlos y no elimina parámetros ajenos', () => {
  const original = new URL('https://fechitat.test/recursos?utm_source=test');
  const filters = { query: 'defensa personal', category: 'articulo' };
  const url = getCatalogUrl(original, filters);
  assert.deepEqual(readCatalogFilters(url.searchParams), filters);
  assert.equal(original.searchParams.has('q'), false);
  assert.equal(url.searchParams.get('utm_source'), 'test');
  assert.equal(getCatalogUrl(url, emptyFilters).search, '?utm_source=test');
  assert.deepEqual(readCatalogFilters(new URLSearchParams('q=%20terminologia%20')), { ...emptyFilters, query: 'terminologia' });
});

test('persiste los filtros por tipo de contenido junto a la búsqueda y permite limpiarlos', () => {
  const url = new URL('https://fechitat.test/recursos');
  for (const { id } of RESOURCE_FORMATS) {
    const filters = { query: 'guía técnica', category: id };
    const filteredUrl = getCatalogUrl(url, filters);
    assert.deepEqual(readCatalogFilters(filteredUrl.searchParams), filters);
    assert.equal(getCatalogUrl(filteredUrl, emptyFilters).search, '');
  }
});

test('elimina el filtro histórico por formato sin perder la búsqueda ni la categoría', () => {
  const url = new URL('https://fechitat.test/recursos?q=defensa&categoria=tecnica&formato=articulo');
  const filters = readCatalogFilters(url.searchParams);
  assert.deepEqual(filters, { query: 'defensa', category: '', topics: ['tecnica'] });
  assert.equal(getCatalogUrl(url, filters).search, '?q=defensa&tema=tecnica');
});
