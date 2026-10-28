import {
  getBlogPostBySlug as getSanityPostBySlug,
  getBlogPosts as getSanityPosts,
  getBlogPostsDestacados as getSanityFeatured,
  getTotalBlogPosts as getSanityCount,
} from './sanityQueries.ts';
import {
  getWordPressBlogPostBySlug,
  getWordPressBlogPosts,
  getWordPressBlogCount,
  getWordPressFeaturedPosts,
  type BlogPost,
} from './wordpress.ts';

export interface PublicBlogPost extends BlogPost {
  imagen?: unknown;
  contenido?: unknown;
}

/**
 * Determina el proveedor editorial activo para noticias.
 * @returns Si se configuró WordPress en el servidor.
 */
export function isWordPressBlogEnabled(): boolean {
  return Boolean(process.env.WORDPRESS_URL);
}

/**
 * Recupera una página de noticias del proveedor activo.
 * @param page Número de página desde 1.
 * @param perPage Entradas por página.
 * @returns Noticias públicas.
 * @throws Error si el proveedor no responde.
 */
export async function getBlogPosts(page = 1, perPage = 12): Promise<PublicBlogPost[]> {
  return isWordPressBlogEnabled()
    ? getWordPressBlogPosts(page, perPage)
    : getSanityPosts(page, perPage);
}

/**
 * Recupera el inventario editorial completo, sin limitarlo a la primera página.
 * @returns Todos los artículos publicados del proveedor configurado.
 * @throws Error si falla el recuento o alguna página del proveedor.
 */
export async function getAllBlogPosts(): Promise<PublicBlogPost[]> {
  const total = await getTotalBlogPosts();
  const posts: PublicBlogPost[] = [];
  for (let page = 1; page <= Math.ceil(total / 100); page++) {
    posts.push(...await getBlogPosts(page, 100));
  }
  return posts;
}

/**
 * Cuenta noticias publicadas del proveedor activo.
 * @returns Cantidad de noticias.
 * @throws Error si el proveedor no responde.
 */
export async function getTotalBlogPosts(): Promise<number> {
  return isWordPressBlogEnabled() ? getWordPressBlogCount() : getSanityCount();
}

/**
 * Busca una noticia pública por slug en el proveedor activo.
 * @param slug Slug de la noticia.
 * @returns Noticia o null si no se encuentra.
 * @throws Error si el proveedor no responde.
 */
export async function getBlogPostBySlug(slug: string): Promise<PublicBlogPost | null> {
  return isWordPressBlogEnabled()
    ? getWordPressBlogPostBySlug(slug)
    : getSanityPostBySlug(slug);
}

/**
 * Recupera noticias destacadas del proveedor activo.
 * @returns Noticias marcadas como destacadas.
 * @throws Error si el proveedor no responde.
 */
export async function getBlogPostsDestacados(): Promise<PublicBlogPost[]> {
  if (!isWordPressBlogEnabled()) return getSanityFeatured();
  const featured = await getWordPressFeaturedPosts();
  return featured.length > 0 ? featured : getWordPressBlogPosts(1, 3);
}
