import {sanity} from './sanity'

/** Obtener todos los eventos ordenados por fecha */
export async function getEventos() {
  return sanity.fetch(`*[_type == "evento"] | order(fecha desc)`)
}

/** Obtiene las rutas y fechas de actualización de eventos para el sitemap dinámico. */
export async function getEventosSitemap(): Promise<Array<{ slug: string; updatedAt: string }>> {
  return sanity.fetch<Array<{ slug: string; updatedAt: string }>>(
    `*[_type == "evento" && defined(slug.current)] { "slug": slug.current, "updatedAt": _updatedAt }`,
  );
}

/** Obtener eventos próximos (excluye el destacado) */
export async function getProximosEventos() {
  return sanity.fetch(
    `*[_type == "evento" && estado == "proximo" && fecha >= now() && destacado != true] | order(fecha asc) {
      ...,
      "tieneGaleria": count(galeria) > 0
    }`
  )
}

/** Obtener eventos pasados (limitado; el resto se carga con "Ver más") */
export async function getEventosPasados(limite = 12) {
  return sanity.fetch(
    `*[_type == "evento" && (estado == "finalizado" || fecha < now())] | order(fecha desc) [0...${limite}] {
      _id,
      titulo,
      slug,
      fecha,
      fechaFin,
      tipo,
      direccion,
      ciudad,
      lugar,
      flyer,
      descripcion,
      "tieneGaleria": count(galeria) > 0
    }`
  )
}

/** Obtener eventos pasados paginados (offset/limite) para "Ver más" */
export async function getEventosPasadosPaginados(offset = 0, limite = 12) {
  return sanity.fetch(
    `*[_type == "evento" && (estado == "finalizado" || fecha < now())] | order(fecha desc) [${offset}...${offset + limite}] {
      _id,
      titulo,
      slug,
      fecha,
      fechaFin,
      tipo,
      direccion,
      ciudad,
      lugar,
      flyer,
      descripcion,
      "tieneGaleria": count(galeria) > 0,
      "flyerUrl": flyer.asset->url
    }`
  )
}

/** Contar eventos pasados (para saber si hay más) */
export async function getTotalEventosPasados() {
  return sanity.fetch(`count(*[_type == "evento" && (estado == "finalizado" || fecha < now())])`)
}

/** Obtener evento por slug */
export async function getEventoBySlug(slug: string) {
  return sanity.fetch(`*[_type == "evento" && slug.current == $slug][0]`, {slug})
}

/** Obtener todas las escuelas */
export async function getEscuelas() {
  return sanity.fetch(`*[_type == "escuela" && activo == true] | order(nombre asc)`)
}

/** Obtener escuela por slug */
export async function getEscuelaBySlug(slug: string) {
  return sanity.fetch(`*[_type == "escuela" && slug.current == $slug][0]`, {slug})
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

/** Obtener posts del blog con paginación */
export async function getBlogPosts(pagina = 1, porPagina = 12) {
  const inicio = (pagina - 1) * porPagina
  return sanity.fetch(
    `*[_type == "blogPost"] | order(fecha desc) [${inicio}...${inicio + porPagina}] {
      _id,
      titulo,
      slug,
      fecha,
      autor,
      extracto,
      imagen,
      categorias,
      destacado
    }`
  )
}

/** Contar posts del blog (para paginación) */
export async function getTotalBlogPosts() {
  return sanity.fetch(`count(*[_type == "blogPost"])`)
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

/** Obtener post por slug */
export async function getBlogPostBySlug(slug: string) {
  return sanity.fetch(`*[_type == "blogPost" && slug.current == $slug][0]`, {slug})
}

/** Obtener integrantes del directorio, excluyendo las comisiones */
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

/** Obtener las comisiones activas y sus integrantes */
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

/** Obtener los documentos oficiales visibles en el sitio */
export async function getDocumentosOficiales() {
  return sanity.fetch(
    `*[_type == "documentoOficial" && activo == true] | order(fechaPublicacion desc, orden asc) {
      _id,
      titulo,
      slug,
      tipo,
      descripcion,
      version,
      fechaPublicacion,
      fechaVigencia,
      estado,
      "archivoUrl": archivo.asset->url,
      "archivoNombre": archivo.asset->originalFilename,
      "comisionNombre": comision->nombre
    }`
  )
}

/** Obtener campeones del salón de campeones */
export async function getCampeones() {
  return sanity.fetch(`*[_type == "campeon"] | order(anio desc)`)
}

/** Obtener hitos históricos para la línea de tiempo */
export async function getHitoHistorico() {
  return sanity.fetch(`*[_type == "hitoHistorico"] | order(anio asc)`)
}

/** Obtener hitos destacados */
export async function getHitosDestacados() {
  return sanity.fetch(`*[_type == "hitoHistorico" && destacado == true] | order(anio asc)`)
}

/** Obtener métricas de la federación */
export async function getMetricas() {
  return sanity.fetch(`*[_type == "metrica" && activo == true] | order(orden asc)`)
}

/** Obtener el próximo evento destacado */
export async function getProximoEventoDestacado() {
  return sanity.fetch(
    `*[_type == "evento" && estado == "proximo" && fecha >= now()] | order(fecha asc)[0] {
      ...,
      "tieneGaleria": count(galeria) > 0
    }`
  )
}

/** Obtener sólo los campos necesarios para el mapa de la portada. */
export async function getEscuelasPorRegion() {
  return sanity.fetch<Array<{
    _id: string; nombre: string; slug?: {current: string}; ciudad?: string;
    region?: string; ubicacion?: {lat?: number; lng?: number}; logoUrl?: string;
  }>>(`*[_type == "escuela" && activo == true] | order(region asc, nombre asc) {
    _id, nombre, slug, ciudad, region, ubicacion, "logoUrl": logo.asset->url
  }`)
}

export interface FiltrosEscuelas {
  busqueda: string;
  ciudad: string;
  region: string;
  pagina: number;
}

const FILTRO_ESCUELAS = `*[_type == "escuela" && activo == true
  && ($region == "" || coalesce(region, "Sin región") == $region)
  && ($ciudad == "" || ciudad == $ciudad)
  && ($busqueda == "" || nombre match $patron || ciudad match $patron || region match $patron)]`;

/** Obtiene una página de escuelas, su total y las ubicaciones disponibles sin enviar todas las fichas. */
export async function getDirectorioEscuelas(filtros: FiltrosEscuelas, porPagina = 6) {
  const {busqueda, ciudad, region, pagina} = filtros;
  const params = {busqueda, ciudad, region, patron: `*${busqueda.replace(/[\*?]/g, ' ').trim()}*`};
  const inicio = (pagina - 1) * porPagina;
  return sanity.fetch<{
    total: number;
    escuelas: Array<{
      _id: string; nombre: string; slug?: {current: string}; instructor?: string;
      ciudad?: string; region?: string; foto?: unknown; logo?: unknown;
      email?: string; whatsapp?: string;
    }>;
    ubicaciones: Array<{ciudad?: string; region?: string}>;
  }>(`{
    "total": count(${FILTRO_ESCUELAS}),
    "escuelas": ${FILTRO_ESCUELAS} | order(nombre asc) [${inicio}...${inicio + porPagina}] {
      _id, nombre, slug, instructor, ciudad, region, foto, logo, email, whatsapp
    },
    "ubicaciones": *[_type == "escuela" && activo == true] {ciudad, region}
  }`, params);
}

/** Obtener las tres publicaciones destacadas para la portada. */
export async function getBlogPostsDestacados() {
  return sanity.fetch(`*[_type == "blogPost" && destacado == true] | order(fecha desc)[0...3]`)
}

/** Obtener testimonios */
export async function getTestimonios() {
  return sanity.fetch(`*[_type == "testimonio"] | order(orden asc)`)
}

/** Obtener eventos del calendario (por mes/año) */
export async function getEventosCalendario(anio: number, mes?: number) {
  if (mes) {
    return sanity.fetch(
      `*[_type == "evento" && fecha >= $inicio && fecha <= $fin] | order(fecha asc)`,
      {
        inicio: `${anio}-${String(mes).padStart(2, '0')}-01`,
        fin: `${anio}-${String(mes).padStart(2, '0')}-31`,
      }
    )
  }
  return sanity.fetch(
    `*[_type == "evento" && fecha >= $inicio && fecha <= $fin] | order(fecha asc)`,
    {
      inicio: `${anio}-01-01`,
      fin: `${anio}-12-31`,
    }
  )
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

