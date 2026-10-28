import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CATALOG_PAGE_SIZE, RESOURCE_FORMATS, articleToResource, documentToResource, entryToResource,
  getCatalogPage, getCatalogUrl, getResourceTopics, readCatalogFilters,
  type CatalogResource,
} from '../src/features/recursos/catalogo.ts';
import { LOCAL_RESOURCES } from '../src/features/recursos/recursos.ts';

const base: CatalogResource = {
  id: 'base', title: 'Base', description: 'Material de práctica', href: '/base',
  category: { id: 'formas', label: 'Formas' }, format: 'guia', keywords: [],
};
const filters = { query: '', category: '' };

test('combina tipo, varias temáticas, categorías y etiquetas sin cambiar la taxonomía principal', () => {
  const resources: CatalogResource[] = [
    { ...base, id: 'uno', format: 'herramienta', topics: [{ id: 'formas', label: 'Formas' }, { id: 'tecnica', label: 'Técnica' }], keywords: ['coordinación'] },
    { ...base, id: 'dos', format: 'herramienta' },
    { ...base, id: 'tres', category: { id: 'historia', label: 'Historia' } },
  ];
  assert.deepEqual(getCatalogPage(resources, { query: 'COORDINACION TECNICA', category: 'herramienta', topics: ['formas', 'tecnica'] }).resources.map((resource) => resource.id), ['uno']);
  assert.equal(getCatalogPage(resources, { ...filters, category: 'guia', topics: ['tecnica'] }).total, 0);
  assert.equal(getCatalogPage(resources, { ...filters, category: 'historia' }).total, 1);
  assert.deepEqual(RESOURCE_FORMATS.map((format) => format.id), ['herramienta', 'guia', 'documento', 'articulo']);
  assert.equal(getResourceTopics({ ...base, category: { id: 'arbitraje', label: 'Arbitraje' } })[0]?.id, 'competencias');
});

test('recomendados prioriza decisiones editoriales y fundamentales antes que novedades', () => {
  const resources: CatalogResource[] = [
    { ...base, id: 'reciente', title: 'Actualizado', updatedAt: '2026-05-01' },
    { ...base, id: 'resto', title: 'Resto', publishedAt: '2026-06-01' },
    { ...base, id: 'fundamental', isFundamental: true, publishedAt: '2020-01-01' },
    { ...base, id: 'prioritario', priority: 10, publishedAt: '2019-01-01' },
  ];
  assert.deepEqual(getCatalogPage(resources, filters).resources.map((resource) => resource.id), ['prioritario', 'fundamental', 'reciente', 'resto']);
  assert.deepEqual(getCatalogPage(resources, { ...filters, sort: 'recientes' }).resources.map((resource) => resource.id), ['resto', 'reciente', 'fundamental', 'prioritario']);
  assert.deepEqual(resources.map((resource) => resource.id), ['reciente', 'resto', 'fundamental', 'prioritario']);
});

test('ordena alfabéticamente con desempate estable y tolera fechas inválidas', () => {
  const resources = [
    { ...base, id: 'z', title: 'Zeta', updatedAt: 'inválida' },
    { ...base, id: 'b', title: 'Árbol' },
    { ...base, id: 'a', title: 'Arbol' },
  ];
  assert.deepEqual(getCatalogPage(resources, { ...filters, sort: 'alfabetico' }).resources.map((resource) => resource.id), ['a', 'b', 'z']);
  assert.equal(getCatalogPage(resources, { ...filters, sort: 'recientes' }).resources.length, 3);
});

test('pagina más de cien recursos sin duplicarlos, perderlos ni renderizarlos todos a la vez', () => {
  const resources = Array.from({ length: 137 }, (_, index) => ({ ...base, id: String(index), title: `Recurso ${String(index).padStart(3, '0')}` }));
  const ids: string[] = [];
  for (let page = 1; page <= 12; page++) {
    const result = getCatalogPage(resources, { ...filters, page, sort: 'alfabetico' });
    assert.equal(result.pages, 12);
    assert.equal(result.total, 137);
    assert.ok(result.resources.length <= CATALOG_PAGE_SIZE);
    ids.push(...result.resources.map((resource) => resource.id));
  }
  assert.equal(ids.length, 137);
  assert.equal(new Set(ids).size, 137);
  assert.equal(getCatalogPage(resources, { ...filters, page: 999 }).page, 12);
  assert.throws(() => getCatalogPage(resources, filters, 0), RangeError);
});

test('destacados son manuales, independientes de las imágenes y limitados a dos', () => {
  const resources = Array.from({ length: 6 }, (_, index) => ({
    ...base, id: String(index), priority: index, isFeatured: index < 4,
    ...(index === 5 ? { image: { src: 'https://cms.test/foto.jpg', alt: 'Práctica' } } : {}),
  }));
  const result = getCatalogPage(resources, filters);
  assert.deepEqual(result.featured.map((resource) => resource.id), ['3', '2']);
  assert.ok(result.featured.every((resource) => !resource.image));
  assert.equal(result.resources.length, resources.length);
  for (const filtered of [{ ...filters, query: 'Material' }, { ...filters, category: 'guia' }, { ...filters, topics: ['formas'] }, { ...filters, sort: 'recientes' as const }]) {
    assert.equal(getCatalogPage(resources, filtered).featured.length, 0);
  }
});

test('distingue catálogo vacío, ausencia de coincidencias y recursos despublicados', () => {
  const empty = getCatalogPage([{ ...base, isPublished: false }], filters);
  assert.equal(empty.inventoryTotal, 0);
  assert.equal(empty.total, 0);
  assert.equal(empty.page, 1);
  assert.equal(empty.pages, 0);
  const noMatches = getCatalogPage([base], { ...filters, query: 'inexistente' });
  assert.equal(noMatches.inventoryTotal, 1);
  assert.equal(noMatches.total, 0);
});

test('normaliza URL compartible con temas repetidos, orden y paginación, conservando parámetros ajenos', () => {
  const original = new URL('https://fechitat.test/recursos?utm_source=test');
  const selected = { query: 'guía técnica', category: 'herramienta', topics: ['formas', 'tecnica'], sort: 'alfabetico' as const, page: 3 };
  const url = getCatalogUrl(original, selected);
  assert.deepEqual(readCatalogFilters(url.searchParams), selected);
  assert.equal(original.search, '?utm_source=test');
  assert.equal(getCatalogUrl(url, filters).search, '?utm_source=test');
  assert.deepEqual(readCatalogFilters(new URLSearchParams('tema=formas&tema=formas&pagina=-2&orden=populares')), { ...filters, topics: ['formas'] });
  assert.deepEqual(readCatalogFilters(new URLSearchParams('pagina=NaN&orden=recomendados')), filters);
});

test('fichas CMS admiten miniatura, foco, icono, prioridad, autor, acción y despublicación', () => {
  const resource = entryToResource({
    _id: 'cms-1', slug: { current: 'programa-examen' }, titulo: 'Programa actualizado',
    tipo: 'guia', destino: '/recursos/formacion/programa-examen', activo: false,
    tematicas: ['teoria', 'tecnica'], palabrasClave: ['grados'], prioridad: 20,
    fundamental: true, destacadoCatalogo: true, accion: 'Consultar programa', icono: 'book-open',
    imagenUrl: 'https://cms.test/practica.jpg', imagenAlt: 'Preparación de examen', imagenFoco: { x: 0.3, y: 0.8 },
    fechaActualizacion: '2026-03-10', autor: 'Comisión Técnica',
  });
  assert.equal(resource.id, LOCAL_RESOURCES[0]?.id);
  assert.equal(resource.isPublished, false);
  assert.equal(resource.isFundamental, true);
  assert.equal(resource.isFeatured, true);
  assert.equal(resource.priority, 20);
  assert.equal(resource.image?.focalPoint?.x, 0.3);
  assert.equal(resource.actionLabel, 'Consultar programa');
  assert.equal(getResourceTopics(resource).length, 2);
});

test('artículos preservan imágenes responsive y no heredan destacado del catálogo por tener portada', () => {
  const resource = articleToResource({
    _id: 'article', titulo: 'Práctica', slug: { current: 'practica' }, categorias: ['tecnica'], destacado: true,
    imagenUrl: 'https://cms.test/original.jpg', imagenAlt: 'Práctica técnica', imagenFoco: { x: 0.2, y: 0.7 },
    imagenSrcSet: 'https://cms.test/small.jpg 160w', tematicas: ['formas', 'tecnica'],
  });
  assert.equal(resource.isFeatured, undefined);
  assert.equal(resource.image?.srcSet, 'https://cms.test/small.jpg 160w');
  assert.deepEqual(resource.image?.focalPoint, { x: 0.2, y: 0.7 });
});

test('documentos no infieren vigencia y distinguen versiones reemplazadas u obsoletas', () => {
  for (const [estado, label] of [['reemplazado', 'Reemplazado'], ['obsoleto', 'Obsoleto']]) {
    const resource = documentToResource({ _id: estado, titulo: 'Reglamento', estado, version: '1.0', fechaActualizacion: '2026-02-01' });
    assert.deepEqual(resource.details, ['Versión 1.0', label]);
    assert.equal(resource.updatedAt, '2026-02-01');
    assert.equal(resource.validity, estado);
  }
  assert.deepEqual(documentToResource({ _id: 'sin-verificar', titulo: 'Documento' }).details, []);
});
