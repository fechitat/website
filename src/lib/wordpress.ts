export interface BlogPost {
  _id: string;
  titulo: string;
  slug: { current: string };
  fecha?: string;
  fechaActualizacion?: string;
  tematicas?: string[];
  prioridad?: number;
  fundamental?: boolean;
  destacadoCatalogo?: boolean;
  autor?: string;
  extracto?: string;
  categorias: string[];
  imagenUrl?: string;
  imagenAlt?: string;
  imagenFoco?: { x: number; y: number };
  imagenSrcSet?: string;
  palabrasClave?: string[];
  contenidoHtml?: string;
  destacado: boolean;
}

interface WordPressPost {
  id: number;
  slug: string;
  date: string;
  date_gmt: string | null;
  modified_gmt?: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  meta?: { fechitat_author_credit?: string };
  sticky: boolean;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string; alt_text?: string; media_details?: { sizes?: Record<string, { source_url?: string; width?: number }> } }>;
    'wp:term'?: Array<Array<{ taxonomy: string; slug: string; name?: string }>>;
  };
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó',
  Uacute: 'Ú', Ntilde: 'Ñ',
};

/**
 * Convierte texto HTML de la API REST en texto plano para Astro.
 * @param html Valor renderizado por WordPress.
 * @returns Texto sin etiquetas ni entidades HTML conocidas.
 */
export function toPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#')) {
      const value = code[1]?.toLowerCase() === 'x'
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(value) && value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)
        ? String.fromCodePoint(value)
        : entity;
    }
    return HTML_ENTITIES[code] ?? entity;
  }).replace(/\s+/g, ' ').trim();
}

/**
 * Obtiene el servidor WordPress sin enviar credenciales al cliente.
 * @returns URL base configurada en el servidor.
 * @throws Error si la URL no se configuró.
 */
function getWordPressUrl(): string {
  const base = process.env.WORDPRESS_URL;
  if (!base) throw new Error('Falta configurar WORDPRESS_URL para consultar WordPress.');
  return `${base.replace(/\/+$/, '')}/wp-json/wp/v2/posts`;
}

/**
 * Solicita entradas públicas a WordPress y conserva la respuesta para leer cabeceras de paginación.
 * @param params Parámetros de consulta REST.
 * @returns Respuesta HTTP válida.
 * @throws Error si WordPress no responde correctamente.
 */
async function fetchPosts(params: URLSearchParams): Promise<Response> {
  const url = `${getWordPressUrl()}?${params.toString()}`;
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (error) {
    throw new Error('No se pudieron consultar las noticias de WordPress.', { cause: error });
  }
  if (!response.ok) throw new Error(`WordPress rechazó la consulta de noticias (HTTP ${response.status}).`);
  return response;
}

/**
 * Mapea una entrada publicada al contrato editorial usado por el website.
 * @param post Entrada REST de WordPress.
 * @returns Noticia para el sitio institucional.
 */
export function mapWordPressPost(post: WordPressPost): BlogPost {
  const image = post._embedded?.['wp:featuredmedia']?.[0];
  const imageSizes = Object.values(image?.media_details?.sizes ?? {})
    .filter((size): size is { source_url: string; width: number } => Boolean(size.source_url) && typeof size.width === 'number' && size.width > 0)
    .map((size) => `${size.source_url} ${size.width}w`);
  const keywords = post._embedded?.['wp:term']?.flat()
    .filter((term) => term.taxonomy === 'post_tag').map((term) => term.name || term.slug) ?? [];
  return {
    _id: `wp-${post.id}`,
    titulo: toPlainText(post.title.rendered),
    slug: { current: post.slug },
    fecha: post.date_gmt ? `${post.date_gmt}Z` : post.date,
    ...(post.modified_gmt ? { fechaActualizacion: `${post.modified_gmt}Z` } : {}),
    autor: post.meta?.fechitat_author_credit || undefined,
    extracto: toPlainText(post.excerpt.rendered),
    categorias: post._embedded?.['wp:term']?.flat()
      .filter((term) => term.taxonomy === 'category').map((term) => term.slug) ?? [],
    imagenUrl: image?.source_url,
    imagenAlt: image?.alt_text,
    ...(imageSizes.length ? { imagenSrcSet: imageSizes.join(', ') } : {}),
    ...(keywords.length > 0 ? { palabrasClave: keywords } : {}),    contenidoHtml: post.content.rendered,
    destacado: post.sticky,
  };
}

/**
 * Devuelve noticias publicadas para una página de resultados.
 * @param page Página solicitada, desde 1.
 * @param perPage Tamaño de la página (máximo 100 en WordPress).
 * @returns Noticias publicadas.
 * @throws Error si falla la API o los parámetros son inválidos.
 */
export async function getWordPressBlogPosts(page = 1, perPage = 12): Promise<BlogPost[]> {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
    throw new Error('Parámetros de paginación de noticias inválidos.');
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage), _embed: '1' });
  const response = await fetchPosts(params);
  return (await response.json() as WordPressPost[]).map(mapWordPressPost);
}

/**
 * Obtiene el número total de noticias públicas.
 * @returns Total informado por WordPress.
 * @throws Error si la cabecera de paginación es inválida.
 */
export async function getWordPressBlogCount(): Promise<number> {
  const response = await fetchPosts(new URLSearchParams({ per_page: '1' }));
  const countHeader = response.headers.get('X-WP-Total');
  const total = countHeader === null ? NaN : Number(countHeader);
  if (!Number.isInteger(total) || total < 0) throw new Error('WordPress no devolvió un total válido de noticias.');
  return total;
}

/**
 * Busca una noticia publicada mediante su slug.
 * @param slug Slug del artículo.
 * @returns Noticia o null cuando no existe.
 * @throws Error si falla la API de WordPress.
 */
export async function getWordPressBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const response = await fetchPosts(new URLSearchParams({ slug, per_page: '1', _embed: '1' }));
  const posts = await response.json() as WordPressPost[];
  return posts[0] && posts[0].slug === slug ? mapWordPressPost(posts[0]) : null;
}

/**
 * Recupera las noticias fijadas en el editor de WordPress.
 * @returns Hasta tres noticias destacadas.
 * @throws Error si falla la API de WordPress.
 */
export async function getWordPressFeaturedPosts(): Promise<BlogPost[]> {
  const response = await fetchPosts(new URLSearchParams({ sticky: 'true', per_page: '3', _embed: '1' }));
  return (await response.json() as WordPressPost[]).map(mapWordPressPost);
}
