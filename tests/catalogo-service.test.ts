import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { sanity } from '../src/lib/sanity.ts';
import { loadCatalogResources } from '../src/features/recursos/service.ts';
import { getCatalogPage } from '../src/features/recursos/catalogo.ts';

const originalProvider = process.env.WORDPRESS_URL;
afterEach(() => {
  mock.restoreAll();
  if (originalProvider === undefined) delete process.env.WORDPRESS_URL;
  else process.env.WORDPRESS_URL = originalProvider;
});

test('no mezcla las noticias del blog en el catálogo de recursos', async () => {
  delete process.env.WORDPRESS_URL;
  mock.method(sanity, 'fetch', async (query: string): Promise<unknown> => {
    if (query.includes('_type == "blogPost"') || query.includes('count(*[_type == "blogPost"]')) {
      throw new Error('El catálogo no debe consultar el blog.');
    }
    if (query.includes('_type == "documentoOficial"')) return [{ _id: 'document', titulo: 'Reglamento', estado: 'reemplazado', archivoUrl: 'https://cms.test/reglamento.pdf' }];
    if (query.includes('_type == "recurso"')) return [{
      _id: 'entry', slug: { current: 'programa-examen' }, titulo: 'Programa actualizado',
      tipo: 'guia', destino: '/recursos/formacion/programa-examen', prioridad: 200,
    }];
    throw new Error(`Consulta inesperada: ${query}`);
  });
  const resources = await loadCatalogResources();
  assert.equal(resources.some((resource) => resource.href.startsWith('/blog/')), false);
  assert.equal(resources.filter((resource) => resource.id === 'programa-examen').length, 1);
  assert.equal(resources.find((resource) => resource.id === 'programa-examen')?.title, 'Programa actualizado');
  assert.equal(resources.find((resource) => resource.id === 'document')?.validity, 'reemplazado');
  assert.equal(getCatalogPage(resources, { query: '', category: '' }).resources.length, 5);
});

test('permite despublicar recursos iniciales mediante una ficha editorial inactiva', async () => {
  delete process.env.WORDPRESS_URL;
  mock.method(sanity, 'fetch', async (query: string): Promise<unknown> => {
    if (query.includes('count(')) return 0;
    if (query.includes('_type == "recurso"')) return [{
      _id: 'entry', slug: { current: 'terminologia' }, titulo: 'Terminología', tipo: 'guia',
      destino: '/recursos/formacion/terminologia', activo: false,
    }];
    return [];
  });
  const resources = await loadCatalogResources();
  const result = getCatalogPage(resources, { query: '', category: '' });
  assert.equal(result.inventoryTotal, 3);
  assert.ok(!result.resources.some((resource) => resource.id === 'terminologia'));
});

test('no presenta recursos parciales como un catálogo válido si falla una fuente', async () => {
  delete process.env.WORDPRESS_URL;
  mock.method(sanity, 'fetch', async (query: string): Promise<unknown> => {
    if (query.includes('_type == "recurso"')) throw new Error('No se pudieron consultar las fichas del catálogo.');
    if (query.includes('count(')) return 0;
    return [];
  });
  await assert.rejects(loadCatalogResources(), /No se pudieron consultar las fichas/);
});
