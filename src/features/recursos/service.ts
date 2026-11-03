import { getCatalogEntries, getDocumentosOficiales } from '../../lib/sanityQueries.ts';
import { documentToResource, entryToResource, type CatalogDocument, type CatalogResource } from './catalogo.ts';
import { LOCAL_RESOURCES } from './recursos.ts';

let cache: { data: CatalogResource[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 segundos de caché en memoria para carga ultra rápida

export function clearCatalogCache(): void {
  cache = null;
}

/**
 * Consolida guías, herramientas y documentos sin mezclar el blog.
 * Utiliza caché en memoria para responder de forma instantánea fuera de tests.
 * @returns Recursos públicos y fichas despublicadas que sustituyen los destinos iniciales.
 * @throws Error si falla cualquiera de las fuentes; nunca devuelve un catálogo parcial como válido.
 */
export async function loadCatalogResources(): Promise<CatalogResource[]> {
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.ASTRO_TEST);
  const now = Date.now();
  if (!isTest && cache && (now - cache.timestamp < CACHE_TTL_MS)) {
    return cache.data;
  }

  const [documents, entries]: [CatalogDocument[], Awaited<ReturnType<typeof getCatalogEntries>>] = await Promise.all([
    getDocumentosOficiales(), getCatalogEntries(),
  ]);
  const resources = new Map([
    ...LOCAL_RESOURCES,
    ...documents.map(documentToResource),
  ].map((resource) => [resource.id, resource]));
  entries.map(entryToResource).forEach((resource) => resources.set(resource.id, resource));
  const finalResources = [...resources.values()].filter((resource) =>
    resource.id !== 'sonkal-itf' &&
    !resource.href.startsWith('/blog') &&
    resource.format !== 'articulo' &&
    resource.category.id !== 'noticias'
  );

  cache = { data: finalResources, timestamp: now };
  return finalResources;
}
