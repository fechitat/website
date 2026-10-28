import { getAllBlogPosts } from '../../lib/blog.ts';
import { getCatalogEntries, getDocumentosOficiales } from '../../lib/sanityQueries.ts';
import { articleToResource, documentToResource, entryToResource, type CatalogDocument, type CatalogResource } from './catalogo.ts';
import { LOCAL_RESOURCES } from './recursos.ts';

/**
 * Consolida el inventario sin ocultar fallos ni duplicar fichas iniciales administradas en el CMS.
 * @returns Recursos públicos y fichas despublicadas que sustituyen los destinos iniciales.
 * @throws Error si falla cualquiera de las fuentes; nunca devuelve un catálogo parcial como válido.
 */
export async function loadCatalogResources(): Promise<CatalogResource[]> {
  const [posts, documents, entries]: [Awaited<ReturnType<typeof getAllBlogPosts>>, CatalogDocument[], Awaited<ReturnType<typeof getCatalogEntries>>] = await Promise.all([
    getAllBlogPosts(), getDocumentosOficiales(), getCatalogEntries(),
  ]);
  const resources = new Map([
    ...LOCAL_RESOURCES,
    ...posts.filter((post) => post.slug?.current).map(articleToResource),
    ...documents.map(documentToResource),
  ].map((resource) => [resource.id, resource]));
  entries.map(entryToResource).forEach((resource) => resources.set(resource.id, resource));
  return [...resources.values()];
}
