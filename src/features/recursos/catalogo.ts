import type { BlogPost } from '../../lib/wordpress.ts';

export interface CatalogOption {
  id: string;
  label: string;
}

export type ResourceFormat = 'articulo' | 'guia' | 'herramienta' | 'documento';
export type CatalogSort = 'recomendados' | 'recientes' | 'alfabetico';
export type ResourceIcon = 'book-open' | 'wrench' | 'newspaper' | 'file-text';

export interface ResourceFormatOption extends CatalogOption {
  id: ResourceFormat;
  singularLabel: string;
  icon: ResourceIcon;
}

// El orden editorial es independiente de la fecha y del inventario del CMS.
export const RESOURCE_FORMATS: ResourceFormatOption[] = [
  { id: 'herramienta', label: 'Herramientas', singularLabel: 'Herramienta', icon: 'wrench' },
  { id: 'guia', label: 'Guías', singularLabel: 'Guía', icon: 'book-open' },
  { id: 'documento', label: 'Documentos', singularLabel: 'Documento', icon: 'file-text' },
  { id: 'articulo', label: 'Artículos', singularLabel: 'Artículo', icon: 'newspaper' },
];
export const RESOURCE_TOPICS: CatalogOption[] = [
  { id: 'formas', label: 'Formas' },
  { id: 'teoria', label: 'Teoría' },
  { id: 'tecnica', label: 'Técnica' },
  { id: 'competencias', label: 'Competencias' },
  { id: 'reglamentos', label: 'Reglamentos' },
  { id: 'institucional', label: 'Institucional' },
];
export const CATALOG_SORTS: Array<{ id: CatalogSort; label: string }> = [
  { id: 'recomendados', label: 'Recomendados' },
  { id: 'recientes', label: 'Más recientes' },
  { id: 'alfabetico', label: 'Alfabético (A–Z)' },
];
export const CATALOG_PAGE_SIZE = 12;

export interface ResourceImage {
  src: string;
  alt: string;
  srcSet?: string;
  focalPoint?: { x: number; y: number };
}

export interface CatalogResource {
  id: string;
  title: string;
  description: string;
  href: string;
  category: CatalogOption;
  format: ResourceFormat;
  keywords: string[];
  topics?: CatalogOption[];
  icon?: ResourceIcon;
  image?: ResourceImage;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  version?: string;
  validity?: string;
  isPublished?: boolean;
  priority?: number;
  isFundamental?: boolean;
  isFeatured?: boolean;
  details?: string[];
  actionLabel?: string;
}

export interface CatalogFilters {
  query: string;
  category: string;
  topics?: string[];
  sort?: CatalogSort;
  page?: number;
}

export interface CatalogEditorialFields {
  tematicas?: string[];
  palabrasClave?: string[];
  prioridad?: number;
  fundamental?: boolean;
  destacadoCatalogo?: boolean;
  fechaActualizacion?: string;
  icono?: ResourceIcon;
}

export interface CatalogDocument extends CatalogEditorialFields {
  _id: string;
  titulo: string;
  descripcion?: string;
  tipo?: string;
  archivoUrl?: string;
  fechaPublicacion?: string;
  fechaVigencia?: string;
  version?: string;
  estado?: string;
  comisionNombre?: string;
}

export interface CatalogEntry extends CatalogEditorialFields {
  _id: string;
  slug?: { current: string };
  titulo: string;
  descripcion?: string;
  tipo: ResourceFormat;
  categoria?: string;
  destino: string;
  accion?: string;
  activo?: boolean;
  fechaPublicacion?: string;
  autor?: string;
  version?: string;
  estado?: string;
  imagenUrl?: string;
  imagenAlt?: string;
  imagenFoco?: { x: number; y: number };
}

export interface CatalogPage {
  resources: CatalogResource[];
  featured: CatalogResource[];
  total: number;
  inventoryTotal: number;
  page: number;
  pages: number;
}

export const RESOURCE_CATEGORIES: CatalogOption[] = [
  { id: 'teoria', label: 'Teoría' },
  { id: 'tecnica', label: 'Técnica' },
  { id: 'formas', label: 'Formas' },
  { id: 'arbitraje', label: 'Arbitraje' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'documentos-oficiales', label: 'Documentos oficiales' },
];

/**
 * Normaliza texto para búsquedas sin distinción de mayúsculas ni tildes.
 * @param value Texto original.
 * @returns Texto simplificado para comparar.
 */
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

/**
 * Conserva las categorías del CMS y unifica sus alias conocidos.
 * @param value Identificador editorial de categoría.
 * @returns Identificador y etiqueta legible.
 */
export function getResourceCategory(value: string): CatalogOption {
  const normalized = normalizeSearchText(value).replace(/\s+/g, '-');
  const id = normalized === 'arbitros' ? 'arbitraje' : normalized;
  const known = [...RESOURCE_CATEGORIES, ...RESOURCE_TOPICS].find((category) => category.id === id);
  const labels: Record<string, string> = { historia: 'Historia', entrevistas: 'Entrevistas' };
  return known ?? { id, label: labels[id] ?? value.charAt(0).toLocaleUpperCase('es') + value.slice(1).replaceAll('-', ' ') };
}

/**
 * Adapta los campos editoriales compartidos sin inventar fechas ni prioridades.
 * @param source Campos públicos del CMS.
 * @returns Configuración de presentación y clasificación.
 */
function editorialFields(source: CatalogEditorialFields): Partial<CatalogResource> {
  return {
    topics: source.tematicas?.map(getResourceCategory),
    priority: source.prioridad,
    isFundamental: source.fundamental,
    isFeatured: source.destacadoCatalogo,
    updatedAt: source.fechaActualizacion,
    icon: source.icono,
  };
}

/**
 * Adapta un artículo editorial sin cambiar su URL ni su fuente de verdad.
 * @param post Artículo del proveedor activo, con imagen resuelta si existe.
 * @returns Recurso de formato artículo con sus metadatos de catálogo.
 */
export function articleToResource(post: BlogPost & CatalogEditorialFields): CatalogResource {
  const category = getResourceCategory(post.categorias?.find((value) => value && normalizeSearchText(value) !== 'eventos') ?? 'noticias');
  return {
    ...editorialFields(post),
    id: post._id,
    title: post.titulo,
    description: post.extracto ?? '',
    href: `/blog/${encodeURIComponent(post.slug.current)}`,
    category,
    format: 'articulo',
    keywords: post.palabrasClave ?? [],
    publishedAt: post.fecha,
    author: post.autor,
    ...(post.imagenUrl ? { image: {
      src: post.imagenUrl, alt: post.imagenAlt || post.titulo,
      ...(post.imagenFoco ? { focalPoint: post.imagenFoco } : {}),
      ...(post.imagenSrcSet ? { srcSet: post.imagenSrcSet } : {}),
    } } : {}),
  };
}

/**
 * Incorpora un documento oficial sin sustituir su ficha ni inferir su vigencia.
 * @param document Metadatos públicos existentes en Sanity.
 * @returns Documento con destino, versión y estado editorial explícito.
 */
export function documentToResource(document: CatalogDocument): CatalogResource {
  const states: Record<string, string> = { archivado: 'Archivado', vigente: 'Vigente', reemplazado: 'Reemplazado', obsoleto: 'Obsoleto' };
  const details = [
    document.version ? `Versión ${document.version}` : '',
    document.estado ? states[document.estado] ?? '' : '',
    document.fechaVigencia ? `Vigencia desde ${document.fechaVigencia}` : '',
  ].filter(Boolean);
  return {
    ...editorialFields(document),
    id: document._id,
    title: document.titulo,
    description: document.descripcion ?? '',
    href: document.archivoUrl || '/recursos/documentos-oficiales',
    category: getResourceCategory('documentos-oficiales'),
    format: 'documento',
    topics: (document.tematicas ?? [document.tipo === 'reglamento' ? 'reglamentos' : 'institucional']).map(getResourceCategory),
    keywords: [document.tipo ?? '', document.comisionNombre ?? '', ...(document.palabrasClave ?? []), ...details],
    publishedAt: document.fechaPublicacion,
    author: document.comisionNombre,
    version: document.version,
    validity: document.estado,
    details,
    actionLabel: document.archivoUrl ? 'Descargar documento' : 'Ver documento',
  };
}

/**
 * Adapta una ficha administrable de cualquier tipo de recurso.
 * @param entry Ficha pública del CMS, incluida su visibilidad.
 * @returns Recurso del catálogo, sin modificar su destino.
 */
export function entryToResource(entry: CatalogEntry): CatalogResource {
  const resource: CatalogResource = {
    ...editorialFields(entry),
    id: entry.slug?.current || entry._id,
    title: entry.titulo,
    description: entry.descripcion ?? '',
    href: entry.destino,
    category: getResourceCategory(entry.categoria || entry.tematicas?.[0] || 'institucional'),
    format: entry.tipo,
    keywords: entry.palabrasClave ?? [],
    isPublished: entry.activo !== false,
    publishedAt: entry.fechaPublicacion,
    author: entry.autor,
    version: entry.version,
    validity: entry.estado,
    actionLabel: entry.accion,
  };
  if (entry.imagenUrl) resource.image = { src: entry.imagenUrl, alt: entry.imagenAlt || entry.titulo, focalPoint: entry.imagenFoco };
  if (entry.tipo === 'documento') {
    resource.details = documentToResource({ _id: entry._id, titulo: entry.titulo, version: entry.version, estado: entry.estado }).details;
  }
  return resource;
}

/**
 * Extiende las categorías históricas sin crear nuevos filtros principales.
 * @param resources Inventario del catálogo.
 * @returns Categorías temáticas únicas.
 */
export function getCatalogCategories(resources: CatalogResource[]): CatalogOption[] {
  const categories = new Map(RESOURCE_CATEGORIES.map((category) => [category.id, category]));
  resources.forEach((resource) => categories.set(resource.category.id, resource.category));
  return [...categories.values()];
}

/**
 * Obtiene las temáticas explícitas o la correspondencia temática histórica.
 * @param resource Ficha del catálogo.
 * @returns Temas únicos que pueden combinarse con el tipo de recurso.
 */
export function getResourceTopics(resource: CatalogResource): CatalogOption[] {
  const aliases: Record<string, string> = { arbitraje: 'competencias', noticias: 'institucional', 'documentos-oficiales': 'institucional' };
  const topics = resource.topics?.length ? resource.topics : [getResourceCategory(aliases[resource.category.id] ?? resource.category.id)];
  return [...new Map([...topics, resource.category].map((topic) => [topic.id, topic])).values()];
}

/**
 * Construye el índice de búsqueda con todos los metadatos clasificatorios.
 * @param resource Recurso normalizado.
 * @returns Texto comparable sin distinción de tildes ni mayúsculas.
 */
export function getResourceSearchText(resource: CatalogResource): string {
  return normalizeSearchText([resource.title, resource.description, ...resource.keywords, resource.category.label,
    ...getResourceTopics(resource).map((topic) => topic.label)].join(' '));
}

/**
 * Combina búsqueda, tipo y todas las temáticas seleccionadas.
 * @param resource Índice de una tarjeta con categoría, formato y temáticas.
 * @param filters Filtros activos; los valores vacíos representan todos.
 * @returns Si coincide con todos los criterios.
 */
export function matchesResource(
  resource: { category: string; format: string; searchText: string; topics?: string[] },
  filters: CatalogFilters,
): boolean {
  const terms = normalizeSearchText(filters.query).split(/\s+/).filter(Boolean);
  const isFormatFilter = RESOURCE_FORMATS.some((format) => format.id === filters.category);
  return (!filters.category || (isFormatFilter ? resource.format : resource.category) === filters.category)
    && (filters.topics ?? []).every((topic) => resource.topics?.includes(topic))
    && terms.every((term) => resource.searchText.includes(term));
}

/**
 * Filtra, ordena y pagina sin alterar el inventario ni mezclar destacados en el grid.
 * @param resources Inventario completo, incluidas las fichas despublicadas.
 * @param filters Estado de búsqueda, temas, orden y página.
 * @param pageSize Tamaño positivo de la página; doce por defecto.
 * @returns Una página acotada y hasta dos destacados independientes.
 * @throws RangeError Si el tamaño de página no es un entero positivo.
 */
export function getCatalogPage(resources: CatalogResource[], filters: CatalogFilters, pageSize = CATALOG_PAGE_SIZE): CatalogPage {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new RangeError('El tamaño de página debe ser un entero positivo.');
  const published = resources.filter((resource) => resource.isPublished !== false);
  const timestamp = (value?: string): number => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
  const alphabetical = (a: CatalogResource, b: CatalogResource): number => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }) || a.id.localeCompare(b.id);
  const recommended = (a: CatalogResource, b: CatalogResource): number =>
    (b.priority ?? 0) - (a.priority ?? 0) || Number(Boolean(b.isFundamental)) - Number(Boolean(a.isFundamental))
    || timestamp(b.updatedAt) - timestamp(a.updatedAt) || alphabetical(a, b);
  const matches = published.filter((resource) => matchesResource({
    category: resource.category.id, format: resource.format, searchText: getResourceSearchText(resource),
    topics: getResourceTopics(resource).map((topic) => topic.id),
  }, filters));
  matches.sort(filters.sort === 'alfabetico' ? alphabetical : filters.sort === 'recientes'
    ? (a, b) => (timestamp(b.updatedAt) || timestamp(b.publishedAt)) - (timestamp(a.updatedAt) || timestamp(a.publishedAt)) || alphabetical(a, b)
    : recommended);
  const pages = Math.ceil(matches.length / pageSize);
  const requestedPage = Number.isSafeInteger(filters.page) && (filters.page ?? 0) > 0 ? filters.page ?? 1 : 1;
  const page = Math.min(requestedPage, pages || 1);
  const canShowFeatured = !filters.query && !filters.category && !filters.topics?.length && (!filters.sort || filters.sort === 'recomendados') && page === 1;
  return {
    resources: matches.slice((page - 1) * pageSize, page * pageSize),
    featured: canShowFeatured ? published.filter((resource) => resource.isFeatured).sort(recommended).slice(0, 2) : [],
    total: matches.length, inventoryTotal: published.length, page, pages,
  };
}

/**
 * Lee y valida filtros compartidos por la URL y el formulario.
 * @param params Parámetros de consulta públicos.
 * @returns Estado normalizado; omite valores predeterminados.
 */
export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const categoryInput = params.get('categoria') ?? '';
  const isFormat = RESOURCE_FORMATS.some((format) => format.id === categoryInput);
  const topics = [...new Set([
    ...params.getAll('tema').filter(Boolean),
    ...(categoryInput && !isFormat ? [getResourceCategory(categoryInput).id] : []),
  ])].slice(0, 20);
  const sort = CATALOG_SORTS.find((option) => option.id === params.get('orden'))?.id;
  const page = Number(params.get('pagina') ?? '1');
  return {
    query: params.get('q')?.trim().slice(0, 200) ?? '',
    category: isFormat ? categoryInput : '',
    ...(topics.length ? { topics } : {}),
    ...(sort && sort !== 'recomendados' ? { sort } : {}),
    ...(Number.isSafeInteger(page) && page > 1 ? { page: Math.min(page, 10000) } : {}),
  };
}

/**
 * Actualiza únicamente los parámetros del catálogo, conservando los ajenos.
 * @param url URL de partida.
 * @param filters Estado deseado de filtros, orden y página.
 * @returns Nueva URL compartible, sin valores predeterminados.
 */
export function getCatalogUrl(url: URL, filters: CatalogFilters): URL {
  const result = new URL(url);
  for (const key of ['formato', 'q', 'categoria', 'tema', 'orden', 'pagina']) result.searchParams.delete(key);
  if (filters.query) result.searchParams.set('q', filters.query);
  if (filters.category) result.searchParams.set('categoria', filters.category);
  for (const topic of filters.topics ?? []) result.searchParams.append('tema', topic);
  if (filters.sort && filters.sort !== 'recomendados') result.searchParams.set('orden', filters.sort);
  if (filters.page && filters.page > 1) result.searchParams.set('pagina', String(filters.page));
  return result;
}
