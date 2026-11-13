import {sanity} from './sanity.ts'
import {defineQuery} from 'groq'
import type { CatalogEntry } from '../features/recursos/catalogo.ts'
import { formatPersonFullName } from './honorifics.ts'

function normalizePostCategories(categories?: (string | null)[] | null): string[] {
  if (!categories || categories.length === 0) return ['noticias'];
  const cleaned = categories
    .filter((c): c is string => Boolean(c))
    .map((cat) => {
      const lower = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (lower.includes('tecnic')) return 'tecnica';
      if (lower.includes('notici')) return 'noticias';
      if (lower.includes('entrevist')) return 'entrevistas';
      if (lower.includes('histori')) return 'historia';
      if (lower.includes('arbitr')) return 'arbitraje';
      return lower;
    });
  return [...new Set(cleaned)];
}

function resolvePostAuthor(
  authorPerson?: { name: string; dan?: number | null; legacyTitle?: string | null } | null,
  fallbackAutor?: string | null
): string {
  if (authorPerson?.name) {
    return formatPersonFullName(authorPerson);
  }
  return fallbackAutor || 'FECHITAT';
}

/** Consulta tipada GROQ para todos los eventos ordenados por fecha */
export const EVENTOS_QUERY = defineQuery(`
  *[_type == "event"] | order(startDate desc) {
    _id,
    "titulo": title,
    slug,
    "fecha": startDate,
    "fechaFin": endDate,
    "tipo": type,
    "estado": status,
    "direccion": address,
    "ciudad": city,
    "lugar": venue,
    "flyer": coverImage,
    "descripcion": description,
    "galeria": gallery,
    "destacado": featured,
    "tieneGaleria": count(gallery) > 0
  }
`);

/** Obtener todos los eventos ordenados por fecha */
export async function getEventos() {
  return sanity.fetch(EVENTOS_QUERY);
}

/** Consulta tipada GROQ para rutas de eventos en el sitemap */
export const EVENTOS_SITEMAP_QUERY = defineQuery(`
  *[_type == "event" && defined(slug.current)] {
    "slug": slug.current,
    "updatedAt": _updatedAt
  }
`);

/** Obtiene las rutas y fechas de actualización de eventos para el sitemap dinámico. */
export async function getEventosSitemap(): Promise<Array<{ slug: string; updatedAt: string }>> {
  return sanity.fetch<Array<{ slug: string; updatedAt: string }>>(EVENTOS_SITEMAP_QUERY);
}

/** Consulta tipada GROQ para próximos eventos (excluye el destacado principal) */
export const PROXIMOS_EVENTOS_QUERY = defineQuery(`
  *[_type == "event" && status == "proximo" && startDate >= now() && featured != true] | order(startDate asc) {
    _id,
    "titulo": title,
    slug,
    "fecha": startDate,
    "fechaFin": endDate,
    "tipo": type,
    "estado": status,
    "direccion": address,
    "ciudad": city,
    "lugar": venue,
    "flyer": coverImage,
    "descripcion": description,
    "galeria": gallery,
    "destacado": featured,
    "tieneGaleria": count(gallery) > 0
  }
`);

/** Obtener eventos próximos (excluye el destacado) */
export async function getProximosEventos() {
  return sanity.fetch(PROXIMOS_EVENTOS_QUERY);
}

/** Consulta tipada GROQ para eventos pasados */
export const EVENTOS_PASADOS_QUERY = defineQuery(`
  *[_type == "event" && (status == "finalizado" || startDate < now())] | order(startDate desc) [0...$limite] {
    _id,
    "titulo": title,
    slug,
    "fecha": startDate,
    "fechaFin": endDate,
    "tipo": type,
    "estado": status,
    "direccion": address,
    "ciudad": city,
    "lugar": venue,
    "flyer": coverImage,
    "descripcion": description,
    "galeria": gallery,
    "tieneGaleria": count(gallery) > 0
  }
`);

/** Obtener eventos pasados (limitado; el resto se carga con "Ver más") */
export async function getEventosPasados(limite = 12) {
  return sanity.fetch(EVENTOS_PASADOS_QUERY, {limite});
}

/** Consulta tipada GROQ para eventos pasados paginados */
export const EVENTOS_PASADOS_PAGINADOS_QUERY = defineQuery(`
  *[_type == "event" && (status == "finalizado" || startDate < now())] | order(startDate desc) [$offset...$offsetEnd] {
    _id,
    "titulo": title,
    slug,
    "fecha": startDate,
    "fechaFin": endDate,
    "tipo": type,
    "estado": status,
    "direccion": address,
    "ciudad": city,
    "lugar": venue,
    "flyer": coverImage,
    "descripcion": description,
    "tieneGaleria": count(gallery) > 0,
    "flyerUrl": coverImage.asset->url
  }
`);

/** Obtener eventos pasados paginados (offset/limite) para "Ver más" */
export async function getEventosPasadosPaginados(offset = 0, limite = 12) {
  return sanity.fetch(EVENTOS_PASADOS_PAGINADOS_QUERY, {offset, offsetEnd: offset + limite});
}

/** Consulta tipada GROQ para total de eventos pasados */
export const TOTAL_EVENTOS_PASADOS_QUERY = defineQuery(`
  count(*[_type == "event" && (status == "finalizado" || startDate < now())])
`);

/** Contar eventos pasados (para saber si hay más) */
export async function getTotalEventosPasados() {
  return sanity.fetch(TOTAL_EVENTOS_PASADOS_QUERY);
}

/** Consulta tipada GROQ para evento por slug */
export const EVENTO_BY_SLUG_QUERY = defineQuery(`
  *[_type == "event" && slug.current == $slug][0] {
    _id,
    "titulo": title,
    slug,
    "fecha": startDate,
    "fechaFin": endDate,
    "tipo": type,
    "estado": status,
    "direccion": address,
    "ciudad": city,
    "lugar": venue,
    "flyer": coverImage,
    "descripcion": description,
    "galeria": gallery,
    "destacado": featured,
    "tieneGaleria": count(gallery) > 0
  }
`);

/** Obtener evento por slug */
export async function getEventoBySlug(slug: string) {
  return sanity.fetch(EVENTO_BY_SLUG_QUERY, {slug});
}

/** Consulta tipada GROQ para listado de escuelas/clubes */
export const ESCUELAS_QUERY = defineQuery(`
  *[_type == "club" && active == true] | order(name asc) {
    _id,
    "nombre": name,
    slug,
    "ciudad": city,
    region,
    "direccion": address,
    whatsapp,
    "email": contactEmail,
    description,
    "foto": coverImage,
    logo,
    "instructor": president->name,
    president-> {
      _id,
      name,
      dan,
      legacyTitle,
      portrait
    },
    schedule,
    location,
    socialLinks
  }
`);

/** Obtener todas las escuelas activas normalizadas desde club */
export async function getEscuelas() {
  return sanity.fetch(ESCUELAS_QUERY);
}

/** Consulta tipada GROQ para escuela/club por slug */
export const ESCUELA_BY_SLUG_QUERY = defineQuery(`
  *[_type == "club" && slug.current == $slug][0] {
    _id,
    "nombre": name,
    slug,
    "ciudad": city,
    region,
    "direccion": address,
    whatsapp,
    "email": contactEmail,
    description,
    "foto": coverImage,
    logo,
    "instructor": president->name,
    president-> {
      _id,
      name,
      dan,
      legacyTitle,
      portrait
    },
    schedule,
    location,
    socialLinks
  }
`);

/** Obtener escuela por slug desde club */
export async function getEscuelaBySlug(slug: string) {
  return sanity.fetch(ESCUELA_BY_SLUG_QUERY, {slug});
}

/** Obtener todos los competidores activos */
export async function getCompetidores() {
  return sanity.fetch(`*[_type == "competidor" && activo == true] | order(nombre asc)`)
}

/** Obtener cinturones negros */
export async function getCinturonesNegros() {
  return sanity.fetch(`*[_type == "competidor" && esCinturonNegro == true] | order(nombre asc)`)
}

/** Obtener competidor por slug */
export async function getCompetidorBySlug(slug: string) {
  return sanity.fetch(`*[_type == "competidor" && slug.current == $slug][0]`, {slug})
}

/** Consulta tipada GROQ para posts del blog con paginación */
export const BLOG_POSTS_QUERY = defineQuery(`
  *[_type == "post"] | order(publishedAt desc) [$inicio...$fin] {
    _id,
    "titulo": title,
    slug,
    "fecha": publishedAt,
    "autor": coalesce(author->name, "FECHITAT"),
    "authorPerson": author->{
      _id,
      name,
      dan,
      legacyTitle
    },
    "extracto": excerpt,
    "imagen": coverImage,
    "imagenUrl": coverImage.asset->url,
    "imagenAlt": coalesce(coverImage.alt, title),
    "imagenFoco": coverImage.hotspot,
    "categorias": categories,
    palabrasClave,
    tematicas,
    prioridad,
    fundamental,
    destacadoCatalogo,
    icono,
    "fechaActualizacion": coalesce(fechaActualizacion, _updatedAt),
    "destacado": coalesce(featured, false),
    "contenido": content
  }
`);

/** Consulta tipada GROQ para contar posts del blog */
export const TOTAL_BLOG_POSTS_QUERY = defineQuery(`count(*[_type == "post"])`);

/** Obtener posts del blog con paginación */
export async function getBlogPosts(pagina = 1, porPagina = 12) {
  const inicio = (pagina - 1) * porPagina;
  const rawPosts = await sanity.fetch(BLOG_POSTS_QUERY, {
    inicio,
    fin: inicio + porPagina,
  });
  return rawPosts.map((post) => ({
    ...post,
    autor: resolvePostAuthor(post.authorPerson, post.autor),
    categorias: normalizePostCategories(post.categorias),
  }));
}

/** Contar posts del blog (para paginación) */
export async function getTotalBlogPosts(): Promise<number> {
  return sanity.fetch(TOTAL_BLOG_POSTS_QUERY);
}

/** Obtener material de estudio activo, ordenado manualmente */
export async function getMaterialEstudio() {
  return sanity.fetch(
    `*[_type == "materialEstudio" && activo == true] | order(orden asc) {
      _id,
      titulo,
      tipo,
      grado,
      descripcion,
      archivo,
      contenido,
      recursos,
      "archivoUrl": archivo.asset->url,
      "archivoNombre": archivo.asset->originalFilename
    }`
  )
}

/** Obtener el programa de examen activo. */
export async function getProgramaExamen() {
  return sanity.fetch(
    `*[_type == "programaExamen" && activo == true] | order(_updatedAt desc)[0] {
      titulo,
      descripcion,
      grados[]{
        _key,
        rango,
        cinturon,
        posiciones,
        ataquesBrazo,
        ataquesPierna,
        defensas,
        formas,
        combate,
        defensaPersonal,
        rotura,
        teoria
      }
    }`,
  )
}

/** Consulta tipada GROQ para un post del blog por slug */
export const BLOG_POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    "titulo": title,
    slug,
    "fecha": publishedAt,
    "autor": coalesce(author->name, "FECHITAT"),
    "authorPerson": author->{
      _id,
      name,
      dan,
      legacyTitle
    },
    "extracto": excerpt,
    "imagen": coverImage,
    "imagenUrl": coverImage.asset->url,
    "imagenAlt": coalesce(coverImage.alt, title),
    "imagenFoco": coverImage.hotspot,
    "categorias": categories,
    palabrasClave,
    tematicas,
    prioridad,
    fundamental,
    destacadoCatalogo,
    icono,
    "fechaActualizacion": coalesce(fechaActualizacion, _updatedAt),
    "destacado": coalesce(featured, false),
    "contenido": content
  }
`);

/** Obtener post por slug */
export async function getBlogPostBySlug(slug: string) {
  const post = await sanity.fetch(BLOG_POST_BY_SLUG_QUERY, { slug });
  if (!post) return null;
  return {
    ...post,
    autor: resolvePostAuthor(post.authorPerson, post.autor),
    categorias: normalizePostCategories(post.categorias),
  };
}

/** Obtener integrantes del directorio, excluyendo las comisiones (Legado) */
export async function getOrganigrama() {
  return sanity.fetch(
    `*[_type == "miembroOrganigrama" && activo == true && nivel != "comision"] | order(orden asc, nombre asc) {
      _id,
      nombre,
      cargo,
      nivel,
      grado,
      foto,
      email,
      bio
    }`
  )
}

export interface BoardMemberResult {
  _key: string;
  role?: string | null;
  contactEmail?: string | null;
  order?: number | null;
  person: {
    _id: string;
    name: string;
    dan?: number | null;
    legacyTitle?: string | null;
    portrait?: any;
    shortBio?: string | null;
  };
}

export interface BoardResult {
  _id: string;
  name: string;
  description?: unknown;
  members: BoardMemberResult[];
}

/** Consulta tipada GROQ para el Directorio Oficial de FECHITAT */
export const DIRECTORIO_OFICIAL_QUERY = defineQuery(`
  *[_type == "organizationUnit" && type == "board"][0] {
    _id,
    name,
    description,
    "members": coalesce(members[] | order(order asc) {
      _key,
      role,
      contactEmail,
      order,
      person-> {
        _id,
        name,
        dan,
        legacyTitle,
        portrait,
        shortBio
      }
    }, [])
  }
`);

/** Obtiene el Directorio Oficial normalizado desde organizationUnit */
export async function getDirectorioOficial(): Promise<BoardResult | null> {
  return sanity.fetch<BoardResult | null>(DIRECTORIO_OFICIAL_QUERY);
}

/** Obtener las comisiones activas y sus integrantes (Legado) */
export async function getComisiones() {
  return sanity.fetch(
    `*[_type == "comision" && activo == true] | order(orden asc, nombre asc) {
      _id,
      nombre,
      descripcion,
      miembros[]->{
        _id,
        nombre,
        cargo,
        grado,
        foto,
        email,
        bio
      }
    }`
  )
}

export interface CommissionMemberResult {
  _key: string;
  role?: string | null;
  contactEmail?: string | null;
  order?: number | null;
  person: {
    _id: string;
    name: string;
    dan?: number | null;
    legacyTitle?: string | null;
    portrait?: any;
    shortBio?: string | null;
  };
}

export interface CommissionResult {
  _id: string;
  name: string;
  description?: unknown;
  type: string;
  order?: number | null;
  parentUnit?: {
    _id: string;
    name: string;
  } | null;
  members: CommissionMemberResult[];
}

/** Consulta tipada GROQ para comisiones y unidades de trabajo de FECHITAT */
export const COMISIONES_QUERY = defineQuery(`
  *[_type == "organizationUnit" && type in ["commission", "other"]] | order(order asc) {
    _id,
    name,
    description,
    type,
    order,
    parentUnit-> {
      _id,
      name
    },
    "members": coalesce(members[] | order(order asc) {
      _key,
      role,
      contactEmail,
      order,
      person-> {
        _id,
        name,
        dan,
        legacyTitle,
        portrait,
        shortBio
      }
    }, [])
  }
`);

/** Obtiene las comisiones y unidades operativas desde organizationUnit */
export async function getComisionesTrabajo(): Promise<CommissionResult[]> {
  return sanity.fetch<CommissionResult[]>(COMISIONES_QUERY);
}

/** Consulta tipada GROQ para documentos oficiales */
export const DOCUMENTOS_OFICIALES_QUERY = defineQuery(`
  *[_type == "officialDocument" || _type == "documentoOficial"] | order(coalesce(publicationDate, fechaPublicacion) desc) {
    _id,
    _type,
    "titulo": coalesce(title, titulo),
    slug,
    "tipo": coalesce(category, tipo),
    "descripcion": coalesce(description, descripcion),
    version,
    "fechaPublicacion": coalesce(publicationDate, fechaPublicacion),
    "fechaVigencia": coalesce(effectiveDate, fechaVigencia),
    "estado": select(
      status == "current" => "vigente",
      status == "superseded" => "reemplazado",
      status == "repealed" => "obsoleto",
      status == "vigente" => "vigente",
      defined(estado) => estado,
      "vigente"
    ),
    tematicas,
    palabrasClave,
    prioridad,
    fundamental,
    destacadoCatalogo,
    icono,
    "fechaActualizacion": coalesce(fechaActualizacion, _updatedAt),
    "archivoUrl": coalesce(file.asset->url, archivo.asset->url),
    "archivoNombre": coalesce(file.asset->originalFilename, archivo.asset->originalFilename),
    "comisionNombre": coalesce(owner->name, comision->nombre, "FECHITAT")
  }
`);

/** Obtener los documentos oficiales visibles en el sitio */
export async function getDocumentosOficiales() {
  const docs = await sanity.fetch(DOCUMENTOS_OFICIALES_QUERY);
  const hasOfficial = docs.some((d) => d._type === 'officialDocument');
  if (hasOfficial) {
    return docs.filter((d) => d._type === 'officialDocument');
  }
  return docs;
}

/**
 * Obtiene las fichas administrables, incluidas las despublicadas para retirar recursos iniciales.
 * @returns Fichas públicas del catálogo sin borradores del CMS.
 * @throws Error si Sanity no responde.
 */
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  return sanity.fetch<CatalogEntry[]>(`*[_type == "recurso" && !(_id in path("drafts.**"))] {
    _id, slug, titulo, descripcion, tipo, categoria, destino, accion, activo,
    tematicas, palabrasClave, prioridad, fundamental, destacadoCatalogo, icono,
    fechaPublicacion, autor, version, estado,
    "fechaActualizacion": coalesce(fechaActualizacion, _updatedAt),
    "imagenUrl": imagen.asset->url, "imagenAlt": imagen.alt, "imagenFoco": imagen.hotspot
  }`);
}

export interface HistoricalMilestoneResult {
  _id: string;
  title: string;
  slug?: { current: string };
  year: number;
  date?: string | null;
  description?: string;
  order?: number | null;
  image?: any;
}

/** Consulta tipada GROQ para la línea de tiempo histórica de FECHITAT */
export const HITOS_HISTORICOS_QUERY = defineQuery(`
  *[_type == "historicalMilestone"] | order(year asc, date asc, order asc) {
    _id,
    title,
    slug,
    year,
    date,
    description,
    order,
    image
  }
`);

/** Obtiene los hitos históricos ordenados cronológicamente */
export async function getHitosHistoricos(): Promise<HistoricalMilestoneResult[]> {
  return sanity.fetch<HistoricalMilestoneResult[]>(HITOS_HISTORICOS_QUERY);
}

/** Obtener campeones del salón de la fama / reconocimientos */
export async function getCampeones() {
  return sanity.fetch(`*[_type == "recognition" && active == true] | order(year desc)`);
}

/** Obtener hitos históricos para la línea de tiempo (Legado) */
export async function getHitoHistorico() {
  return sanity.fetch(`*[_type == "hitoHistorico"] | order(anio asc)`);
}

/** Obtener hitos destacados */
export async function getHitosDestacados() {
  return sanity.fetch(`*[_type == "hitoHistorico" && destacado == true] | order(anio asc)`)
}

/** Obtener métricas de la federación */
export async function getMetricas() {
  return sanity.fetch(`*[_type == "metrica" && activo == true] | order(orden asc)`)
}

/** Consulta tipada GROQ para próximo evento destacado */
export const PROXIMO_EVENTO_DESTACADO_QUERY = defineQuery(`
  *[_type == "event" && status == "proximo" && startDate >= now()] | order(startDate asc)[0] {
    _id,
    "titulo": title,
    slug,
    "fecha": startDate,
    "fechaFin": endDate,
    "tipo": type,
    "estado": status,
    "direccion": address,
    "ciudad": city,
    "lugar": venue,
    "flyer": coverImage,
    "descripcion": description,
    "destacado": featured,
    "tieneGaleria": count(gallery) > 0
  }
`);

/** Obtener el próximo evento destacado */
export async function getProximoEventoDestacado() {
  return sanity.fetch(PROXIMO_EVENTO_DESTACADO_QUERY);
}

/** Consulta tipada GROQ para mapa de escuelas en portada */
export const ESCUELAS_MAPA_QUERY = defineQuery(`
  *[_type == "club" && active == true] | order(region asc, name asc) {
    _id,
    "nombre": name,
    slug,
    "ciudad": city,
    region,
    "ubicacion": location,
    "logoUrl": logo.asset->url
  }
`);

/** Obtener sólo los campos necesarios para el mapa de la portada. */
export async function getEscuelasPorRegion() {
  return sanity.fetch<Array<{
    _id: string; nombre: string; slug?: {current: string}; ciudad?: string;
    region?: string; ubicacion?: {lat?: number; lng?: number}; logoUrl?: string;
  }>>(ESCUELAS_MAPA_QUERY);
}

export interface FiltrosEscuelas {
  busqueda: string;
  ciudad: string;
  region: string;
  pagina: number;
}

const FILTRO_CLUBES = `*[_type == "club" && active == true
  && ($region == "" || coalesce(region, "Sin región") == $region)
  && ($ciudad == "" || city == $ciudad)
  && ($busqueda == "" || name match $patron || city match $patron || region match $patron)]`;

/** Obtiene una página de escuelas, su total y las ubicaciones disponibles sin enviar todas las fichas. */
export async function getDirectorioEscuelas(filtros: FiltrosEscuelas, porPagina = 6) {
  const {busqueda, ciudad, region, pagina} = filtros;
  const params = {busqueda, ciudad, region, patron: `*${busqueda.replace(/[\*?]/g, ' ').trim()}*`};
  const inicio = (pagina - 1) * porPagina;
  return sanity.fetch<{
    total: number;
    escuelas: Array<{
      _id: string;
      nombre: string;
      slug?: {current: string};
      instructor?: string;
      president?: {
        _id: string;
        name: string;
        dan?: number | null;
        legacyTitle?: string | null;
      } | null;
      ciudad?: string;
      region?: string;
      foto?: unknown;
      logo?: unknown;
      email?: string;
      whatsapp?: string;
    }>;
    ubicaciones: Array<{ciudad?: string; region?: string}>;
  }>(`{
    "total": count(${FILTRO_CLUBES}),
    "escuelas": ${FILTRO_CLUBES} | order(name asc) [${inicio}...${inicio + porPagina}] {
      _id,
      "nombre": name,
      slug,
      "instructor": president->name,
      president-> {
        _id,
        name,
        dan,
        legacyTitle
      },
      "ciudad": city,
      region,
      "foto": coverImage,
      logo,
      "email": contactEmail,
      whatsapp
    },
    "ubicaciones": *[_type == "club" && active == true] {
      "ciudad": city,
      region
    }
  }`, params);
}

/** Consulta tipada GROQ para posts destacados del blog */
export const BLOG_POSTS_DESTACADOS_QUERY = defineQuery(`
  *[_type == "post" && featured == true] | order(publishedAt desc)[0...3] {
    _id,
    "titulo": title,
    slug,
    "fecha": publishedAt,
    "autor": coalesce(author->name, "FECHITAT"),
    "authorPerson": author->{
      _id,
      name,
      dan,
      legacyTitle
    },
    "extracto": excerpt,
    "imagen": coverImage,
    "imagenUrl": coverImage.asset->url,
    "imagenAlt": coalesce(coverImage.alt, title),
    "imagenFoco": coverImage.hotspot,
    "categorias": categories,
    palabrasClave,
    tematicas,
    prioridad,
    fundamental,
    destacadoCatalogo,
    icono,
    "fechaActualizacion": coalesce(fechaActualizacion, _updatedAt),
    "destacado": coalesce(featured, false),
    "contenido": content
  }
`);

/** Obtener las publicaciones destacadas para la portada */
export async function getBlogPostsDestacados() {
  const rawPosts = await sanity.fetch(BLOG_POSTS_DESTACADOS_QUERY);
  return rawPosts.map((post) => ({
    ...post,
    autor: resolvePostAuthor(post.authorPerson, post.autor),
    categorias: normalizePostCategories(post.categorias),
  }));
}

/** Obtener testimonios */
export async function getTestimonios() {
  return sanity.fetch(`*[_type == "testimonio"] | order(orden asc)`)
}

/** Consulta tipada GROQ para eventos en calendario por rango de fechas */
export const EVENTOS_CALENDARIO_QUERY = defineQuery(`
  *[_type == "event" && startDate >= $inicio && startDate <= $fin] | order(startDate asc) {
    _id,
    "titulo": title,
    slug,
    "fecha": startDate,
    "fechaFin": endDate,
    "tipo": type,
    "estado": status,
    "direccion": address,
    "ciudad": city,
    "lugar": venue,
    "flyer": coverImage,
    "descripcion": description,
    "tieneGaleria": count(gallery) > 0
  }
`);

/** Obtener eventos del calendario (por mes/año) */
export async function getEventosCalendario(anio: number, mes?: number) {
  if (mes) {
    return sanity.fetch(EVENTOS_CALENDARIO_QUERY, {
      inicio: `${anio}-${String(mes).padStart(2, '0')}-01`,
      fin: `${anio}-${String(mes).padStart(2, '0')}-31`,
    });
  }
  return sanity.fetch(EVENTOS_CALENDARIO_QUERY, {
    inicio: `${anio}-01-01`,
    fin: `${anio}-12-31`,
  });
}

/** Obtener camisetas/uniformes históricos ordenados cronológicamente */
export async function getCamisetas() {
  return sanity.fetch(
    `*[_type == "camiseta" && activo == true] | order(anioOrden asc) {
      _id,
      titulo,
      periodo,
      anioOrden,
      imagenFrente,
      imagenDorso,
      coloresPrincipales,
      disenador,
      lugarEvento,
      descripcion
    }`
  )
}

export interface TerminoGlosario {
  coreano: string;
  romanizacion: string;
  espanol: string;
  ingles?: string;
  categoria: string;
  audioUrl?: string;
  orden?: number;
}

export const TERMINOS_GLOSARIO_BASE: TerminoGlosario[] = [
  // General
  { coreano: '태권도', romanizacion: 'Taekwon-Do', espanol: 'Arte marcial de pies y puños', ingles: 'The way of foot and fist', categoria: 'General', orden: 1 },
  { coreano: '국기', romanizacion: 'Ku (Gukgi)', espanol: 'Bandera nacional', ingles: 'National flag', categoria: 'General', orden: 2 },
  { coreano: '틀', romanizacion: 'Tul', espanol: 'Forma o patrón', ingles: 'Pattern', categoria: 'General', orden: 3 },
  { coreano: '도장', romanizacion: 'Dojang', espanol: 'Lugar de entrenamiento', ingles: 'Training hall', categoria: 'General', orden: 4 },
  { coreano: '도복', romanizacion: 'Dobok', espanol: 'Traje de entrenamiento', ingles: 'Training suit', categoria: 'General', orden: 5 },
  { coreano: '띠', romanizacion: 'Ti', espanol: 'Cinturón', ingles: 'Belt', categoria: 'General', orden: 6 },
  { coreano: '사범', romanizacion: 'Sabum', espanol: 'Instructor (IV a VI Dan)', ingles: 'Instructor', categoria: 'General', orden: 7 },
  { coreano: '사현', romanizacion: 'Sahyun', espanol: 'Maestro (VII y VIII Dan)', ingles: 'Master', categoria: 'General', orden: 8 },
  { coreano: '사성', romanizacion: 'Sasung', espanol: 'Gran Maestro (IX Dan)', ingles: 'Grand Master', categoria: 'General', orden: 9 },
  { coreano: '급', romanizacion: 'Gup', espanol: 'Grado de cinturón de color', ingles: 'Colour-belt rank', categoria: 'Grados', orden: 10 },
  { coreano: '단', romanizacion: 'Dan', espanol: 'Grado de cinturón negro', ingles: 'Black-belt degree', categoria: 'Grados', orden: 11 },

  // Comandos
  { coreano: '차렷', romanizacion: 'Charyot', espanol: 'Atención / Firmes', ingles: 'Attention', categoria: 'Comandos', orden: 12 },
  { coreano: '경례', romanizacion: 'Kyong Ye', espanol: 'Saludo de cortesía', ingles: 'Bow', categoria: 'Comandos', orden: 13 },
  { coreano: '준비', romanizacion: 'Junbi', espanol: 'Listo / En guardia', ingles: 'Ready', categoria: 'Comandos', orden: 14 },
  { coreano: '시작', romanizacion: 'Sijak', espanol: 'Comenzar', ingles: 'Begin / Start', categoria: 'Comandos', orden: 15 },
  { coreano: '그만', romanizacion: 'Goman', espanol: 'Detenerse / Alto', ingles: 'Stop', categoria: 'Comandos', orden: 16 },
  { coreano: '쉬어', romanizacion: 'Swiyo', espanol: 'Descanso', ingles: 'Relax / At ease', categoria: 'Comandos', orden: 17 },
  { coreano: '해산', romanizacion: 'Haesan', espanol: 'Rompan filas / Salir', ingles: 'Dismiss', categoria: 'Comandos', orden: 18 },

  // Posiciones (Sogi)
  { coreano: '서기', romanizacion: 'Sogi', espanol: 'Posición', ingles: 'Stance', categoria: 'Posiciones', orden: 19 },
  { coreano: '차렷서기', romanizacion: 'Charyot Sogi', espanol: 'Posición de atención', ingles: 'Attention stance', categoria: 'Posiciones', orden: 20 },
  { coreano: '나란히서기', romanizacion: 'Narani Sogi', espanol: 'Posición de pies paralelos', ingles: 'Parallel stance', categoria: 'Posiciones', orden: 21 },
  { coreano: '건눈서기', romanizacion: 'Gunnun Sogi', espanol: 'Posición de caminar', ingles: 'Walking stance', categoria: 'Posiciones', orden: 22 },
  { coreano: '니은자서기', romanizacion: 'Niunja Sogi', espanol: 'Posición en L', ingles: 'L-stance', categoria: 'Posiciones', orden: 23 },
  { coreano: '앉은서기', romanizacion: 'Annun Sogi', espanol: 'Posición de jinete', ingles: 'Sitting stance', categoria: 'Posiciones', orden: 24 },
  { coreano: '고정서기', romanizacion: 'Gojung Sogi', espanol: 'Posición en L larga / fija', ingles: 'Fixed stance', categoria: 'Posiciones', orden: 25 },
  { coreano: '교차서기', romanizacion: 'Kyocha Sogi', espanol: 'Posición de pies cruzados', ingles: 'X-stance', categoria: 'Posiciones', orden: 26 },

  // Técnicas (Ataques y Defensas)
  { coreano: '지르기', romanizacion: 'Jirugi', espanol: 'Golpe de puño', ingles: 'Punch', categoria: 'Técnica', orden: 27 },
  { coreano: '막기', romanizacion: 'Makgi', espanol: 'Defensa o bloqueo', ingles: 'Block', categoria: 'Técnica', orden: 28 },
  { coreano: '차기', romanizacion: 'Chagi', espanol: 'Patada', ingles: 'Kick', categoria: 'Técnica', orden: 29 },
  { coreano: '앞차기', romanizacion: 'Ap Chagi', espanol: 'Patada frontal', ingles: 'Front kick', categoria: 'Técnica', orden: 30 },
  { coreano: '돌려차기', romanizacion: 'Dollyo Chagi', espanol: 'Patada circular', ingles: 'Turning kick', categoria: 'Técnica', orden: 31 },
  { coreano: '옆차기', romanizacion: 'Yop Chagi', espanol: 'Patada lateral', ingles: 'Side kick', categoria: 'Técnica', orden: 32 },
  { coreano: '반대돌려차기', romanizacion: 'Bandae Dollyo Chagi', espanol: 'Patada con giro talón', ingles: 'Reverse turning kick', categoria: 'Técnica', orden: 33 },
  { coreano: '내려차기', romanizacion: 'Naeryo Chagi', espanol: 'Patada descendente', ingles: 'Downward kick', categoria: 'Técnica', orden: 34 },
  { coreano: '손칼', romanizacion: 'Sonkal', espanol: 'Canto de la mano', ingles: 'Knife-hand', categoria: 'Técnica', orden: 35 },
  { coreano: '팔목', romanizacion: 'Palmok', espanol: 'Antebrazo', ingles: 'Forearm', categoria: 'Técnica', orden: 36 },
  { coreano: '맞서기', romanizacion: 'Matsokgi', espanol: 'Combate', ingles: 'Sparring', categoria: 'Técnica', orden: 37 },
  { coreano: '위력', romanizacion: 'Wiryok', espanol: 'Rotura de poder', ingles: 'Power breaking', categoria: 'Técnica', orden: 38 },

  // Números
  { coreano: '하나', romanizacion: 'Hana', espanol: 'Uno (1)', ingles: 'One', categoria: 'Números', orden: 39 },
  { coreano: '둘', romanizacion: 'Dul', espanol: 'Dos (2)', ingles: 'Two', categoria: 'Números', orden: 40 },
  { coreano: '셋', romanizacion: 'Set', espanol: 'Tres (3)', ingles: 'Three', categoria: 'Números', orden: 41 },
  { coreano: '넷', romanizacion: 'Net', espanol: 'Cuatro (4)', ingles: 'Four', categoria: 'Números', orden: 42 },
  { coreano: '다섯', romanizacion: 'Dasot', espanol: 'Cinco (5)', ingles: 'Five', categoria: 'Números', orden: 43 },
  { coreano: '여섯', romanizacion: 'Yosot', espanol: 'Seis (6)', ingles: 'Six', categoria: 'Números', orden: 44 },
  { coreano: '일곱', romanizacion: 'Ilgop', espanol: 'Siete (7)', ingles: 'Seven', categoria: 'Números', orden: 45 },
  { coreano: '여덟', romanizacion: 'Yodol', espanol: 'Ocho (8)', ingles: 'Eight', categoria: 'Números', orden: 46 },
  { coreano: '아홉', romanizacion: 'Ahop', espanol: 'Nueve (9)', ingles: 'Nine', categoria: 'Números', orden: 47 },
  { coreano: '열', romanizacion: 'Yol', espanol: 'Diez (10)', ingles: 'Ten', categoria: 'Números', orden: 48 },

  // Zonas del cuerpo
  { coreano: '높은데', romanizacion: 'Nopunde', espanol: 'Zona alta (cuello hacia arriba)', ingles: 'High section', categoria: 'Zonas', orden: 49 },
  { coreano: '가운데', romanizacion: 'Kaunde', espanol: 'Zona media (hombros al ombligo)', ingles: 'Middle section', categoria: 'Zonas', orden: 50 },
  { coreano: '낮은데', romanizacion: 'Najunde', espanol: 'Zona baja (ombligo hacia abajo)', ingles: 'Low section', categoria: 'Zonas', orden: 51 },
];

/** Obtiene los términos del glosario técnico desde Sanity con fallback seguro */
export async function getTerminosGlosario(): Promise<TerminoGlosario[]> {
  try {
    const terminos = await sanity.fetch<TerminoGlosario[]>(`
      *[_type == "glosarioTermino" && (activo == true || !defined(activo))] | order(coalesce(orden, 999) asc, romanizacion asc) {
        coreano,
        romanizacion,
        espanol,
        ingles,
        categoria,
        "audioUrl": audio.asset->url,
        orden
      }
    `);
    if (terminos && terminos.length > 0) {
      return terminos;
    }
  } catch (error) {
    console.warn('Error al consultar glosario desde Sanity, usando términos base:', error);
  }
  return TERMINOS_GLOSARIO_BASE;
}

