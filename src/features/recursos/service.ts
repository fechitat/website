import { getCatalogEntries, getDocumentosOficiales } from '../../lib/sanityQueries.ts';
import { documentToResource, entryToResource, type CatalogDocument, type CatalogResource } from './catalogo.ts';
import { LOCAL_RESOURCES } from './recursos.ts';

/**
 * Consolida guías, herramientas y documentos sin mezclar el blog.
 * @returns Recursos públicos y fichas despublicadas que sustituyen los destinos iniciales.
 * @throws Error si falla cualquiera de las fuentes; nunca devuelve un catálogo parcial como válido.
 */
export async function loadCatalogResources(): Promise<CatalogResource[]> {
  const [documents, entries]: [CatalogDocument[], Awaited<ReturnType<typeof getCatalogEntries>>] = await Promise.all([
    getDocumentosOficiales(), getCatalogEntries(),
  ]);
  const resources = new Map([
    ...LOCAL_RESOURCES,
    ...documents.map(documentToResource),
  ].map((resource) => [resource.id, resource]));
  entries.map(entryToResource).forEach((resource) => resources.set(resource.id, resource));
  return [...resources.values()];
}
