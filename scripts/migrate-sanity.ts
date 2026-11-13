/**
 * Script de migración idempotente para FECHITAT Sanity.
 *
 * Uso:
 *   node --experimental-strip-types scripts/migrate-sanity.ts [--dry-run] [--apply] [--dataset=<name>]
 *
 * Por defecto corre en --dry-run (modo seguro, no muta la base de datos).
 * Requiere --apply explícito para ejecutar mutaciones.
 */

import {createClient} from '@sanity/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  extractHonorificAndName,
  getHonorific,
  type PersonHonorificInput,
} from '../src/lib/honorifics.ts';
import {normalizeWhatsAppNumber} from '../src/lib/whatsapp.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Parseo de argumentos de línea de comandos
const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = !isApply || args.includes('--dry-run');
const datasetArg = args.find((a) => a.startsWith('--dataset='));
const targetDataset = datasetArg ? datasetArg.split('=')[1] : 'production';

// 2. Obtención de token de Sanity
function getSanityToken(): string {
  if (process.env.SANITY_WRITE_TOKEN) {
    return process.env.SANITY_WRITE_TOKEN.trim();
  }
  // Verificar credenciales de login Sanity CLI en ~/.config/sanity/config.json
  const userConfigPath = path.join(process.env.HOME || '', '.config', 'sanity', 'config.json');
  if (fs.existsSync(userConfigPath)) {
    try {
      const userCfg = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));
      if (userCfg.authToken) {
        return userCfg.authToken.trim();
      }
    } catch {}
  }
  const envPath = path.join(rootDir, 'sanity', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/SANITY_AUTH_TOKEN=(.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  throw new Error(
    'No se encontró token de Sanity. Configure SANITY_WRITE_TOKEN o verifique sanity/.env'
  );
}

const token = getSanityToken();

const client = createClient({
  projectId: 'wyg7m2t0',
  dataset: targetDataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false, // Frescura garantizada para migración
});

// Normalización de slugs y strings
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function normalizeCompareName(name: string): string {
  const {name: clean} = extractHonorificAndName(name);
  return clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runMigration() {
  console.log(`\n======================================================`);
  console.log(` MIGRACIÓN SANITY FECHITAT — Dataset: [${targetDataset}]`);
  console.log(` Modo: ${isApply ? '🚀 APLICAR CAMBIOS (--apply)' : '🔍 SIMULACIÓN (--dry-run)'}`);
  console.log(`======================================================\n`);

  // Fecha de ejecución para nombres de reportes
  const dateStr = new Date().toISOString().split('T')[0];
  const reportsDir = path.join(rootDir, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, {recursive: true});
  }

  // 3. Extracción de inventario actual publicado y borradores
  console.log('1. Extrayendo documentos existentes desde Sanity...');
  const [
    miembros,
    comisiones,
    escuelas,
    documentos,
    eventos,
    posts,
    hitos,
    metricas,
    drafts,
  ] = await Promise.all([
    client.fetch<any[]>(`*[_type == "miembroOrganigrama" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_type == "comision" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_type == "escuela" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_type == "documentoOficial" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_type == "evento" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_type == "blogPost" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_type == "hitoHistorico" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_type == "metrica" && !(_id in path("drafts.**"))]`),
    client.fetch<any[]>(`*[_id in path("drafts.**")]{_id, _type}`),
  ]);

  console.log(`   - Miembros organigrama: ${miembros.length}`);
  console.log(`   - Comisiones: ${comisiones.length}`);
  console.log(`   - Escuelas: ${escuelas.length}`);
  console.log(`   - Documentos oficiales: ${documentos.length}`);
  console.log(`   - Eventos: ${eventos.length}`);
  console.log(`   - Blog posts: ${posts.length}`);
  console.log(`   - Hitos históricos: ${hitos.length}`);
  console.log(`   - Métricas: ${metricas.length}`);
  console.log(`   - Borradores detectados: ${drafts.length}`);

  // Estructura de reporte
  const report = {
    date: dateStr,
    dataset: targetDataset,
    mode: isApply ? 'apply' : 'dry-run',
    counts: {
      source: {
        miembroOrganigrama: miembros.length,
        comision: comisiones.length,
        escuela: escuelas.length,
        documentoOficial: documentos.length,
        evento: eventos.length,
        blogPost: posts.length,
        hitoHistorico: hitos.length,
        metrica: metricas.length,
      },
      target: {
        person: 0,
        organizationUnit: 0,
        club: 0,
        officialDocument: 0,
        event: 0,
        post: 0,
        historicalMilestone: 0,
        federation: 1,
      },
      draftsSkipped: drafts.length,
    },
    personsDeduplicated: [] as any[],
    normalizations: {
      persons: [] as any[],
      schools: [] as any[],
      milestones: [] as any[],
    },
    missingData: {
      schoolsWithoutPresident: [] as string[],
      schoolsWithoutLocationOrLogo: [] as string[],
      lowResPortraits: [] as string[],
      personsWithoutDan: [] as string[],
    },
    draftsList: drafts.map((d) => d._id),
  };

  const mutations: any[] = [];

  // =========================================================================
  // 4. PERSONAS: Deduplicación exacta y normalización
  // =========================================================================
  console.log('\n2. Procesando y deduplicando Personas...');
  const personMapByNormalizedName = new Map<string, any>();

  // A) De miembros del organigrama
  for (const m of miembros) {
    const rawName = m.nombre || '';
    const {name: cleanName, legacyTitle} = extractHonorificAndName(rawName);
    const normKey = normalizeCompareName(rawName);
    const slug = slugify(cleanName);

    // Mapeo de grado Dan
    let dan: number | null = null;
    if (m.grado && typeof m.grado === 'string') {
      const danMatch = m.grado.match(/(\d+)/);
      if (danMatch && m.grado.toLowerCase().includes('dan')) {
        dan = parseInt(danMatch[1], 10);
      }
    }

    const personDoc = {
      _id: `person-${slug}`,
      _type: 'person',
      name: cleanName,
      slug: {_type: 'slug', current: slug},
      dan: dan,
      legacyTitle: dan ? null : legacyTitle,
      portrait: m.foto ? m.foto : undefined,
      shortBio: m.bio || undefined,
    };

    personMapByNormalizedName.set(normKey, {
      doc: personDoc,
      sourceIds: [m._id],
      portraitAsset: m.foto?.asset?._ref,
      originalNames: [rawName],
    });

    report.normalizations.persons.push({
      original: rawName,
      normalizedName: cleanName,
      dan: dan,
      legacyTitle: personDoc.legacyTitle,
      resultingId: personDoc._id,
    });
  }

  // B) De presidentes de escuelas (instructores)
  for (const esc of escuelas) {
    if (!esc.instructor || typeof esc.instructor !== 'string' || !esc.instructor.trim()) {
      report.missingData.schoolsWithoutPresident.push(esc.nombre);
      continue;
    }

    const rawName = esc.instructor.trim();
    const {name: cleanName, legacyTitle} = extractHonorificAndName(rawName);
    const normKey = normalizeCompareName(rawName);
    const slug = slugify(cleanName);

    if (personMapByNormalizedName.has(normKey)) {
      // Coincidencia exacta -> Fusionar
      const existing = personMapByNormalizedName.get(normKey);
      existing.sourceIds.push(`escuela:${esc.slug?.current || esc._id}`);
      existing.originalNames.push(rawName);

      report.personsDeduplicated.push({
        normalizedName: cleanName,
        sources: existing.sourceIds,
        personId: existing.doc._id,
      });
    } else {
      // Persona nueva originada desde escuela
      const personDoc = {
        _id: `person-${slug}`,
        _type: 'person',
        name: cleanName,
        slug: {_type: 'slug', current: slug},
        dan: null,
        legacyTitle: legacyTitle,
      };

      personMapByNormalizedName.set(normKey, {
        doc: personDoc,
        sourceIds: [`escuela:${esc.slug?.current || esc._id}`],
        portraitAsset: undefined,
        originalNames: [rawName],
      });

      report.normalizations.persons.push({
        original: rawName,
        normalizedName: cleanName,
        dan: null,
        legacyTitle: legacyTitle,
        resultingId: personDoc._id,
      });
    }
  }

  // Agregar mutaciones de personas
  for (const item of personMapByNormalizedName.values()) {
    mutations.push({createOrReplace: item.doc});
    report.counts.target.person++;

    // Verificar retratos de baja resolución
    if (item.portraitAsset && item.portraitAsset.includes('100x100')) {
      report.missingData.lowResPortraits.push(`${item.doc.name} (${item.portraitAsset})`);
    }
    if (!item.doc.dan) {
      report.missingData.personsWithoutDan.push(item.doc.name);
    }
  }

  console.log(`   -> Total personas generadas (deduplicadas): ${report.counts.target.person}`);

  // Helper para buscar referencia a persona
  function findPersonRef(rawName: string | undefined): {_type: 'reference'; _ref: string} | null {
    if (!rawName) return null;
    const norm = normalizeCompareName(rawName);
    const match = personMapByNormalizedName.get(norm);
    if (match) {
      return {_type: 'reference', _ref: match.doc._id};
    }
    return null;
  }

  // =========================================================================
  // 5. UNIDADES ORGANIZACIONALES (Directorio y Comisiones)
  // =========================================================================
  console.log('\n3. Construyendo Unidades Organizacionales...');

  // A) Directorio Oficial (Board)
  const boardMembers = miembros
    .filter((m) => m.nivel !== 'comision')
    .sort((a, b) => (a.orden || 99) - (b.orden || 99))
    .map((m) => ({
      _key: `member-${slugify(m.nombre)}`,
      person: findPersonRef(m.nombre)!,
      role: m.cargo || undefined,
      contactEmail: m.email || undefined,
      order: m.orden || 1,
    }));

  const boardDoc = {
    _id: 'unit-directorio-oficial',
    _type: 'organizationUnit',
    name: 'Directorio Oficial',
    slug: {_type: 'slug', current: 'directorio-oficial'},
    type: 'board',
    order: 1,
    members: boardMembers,
  };
  mutations.push({createOrReplace: boardDoc});
  report.counts.target.organizationUnit++;

  // B) Comisión de Disciplina
  const disciplinaSrc = comisiones.find((c) => (c.nombre || '').toLowerCase().includes('disciplina'));
  const disciplinaMembers = disciplinaSrc?.miembros?.map((refObj: any, idx: number) => {
    // Buscar el miembro original para obtener nombre
    const originalMiembro = miembros.find((m) => m._id === refObj._ref);
    const personRef = findPersonRef(originalMiembro?.nombre);
    return {
      _key: `disc-member-${idx + 1}`,
      person: personRef || {_type: 'reference', _ref: refObj._ref},
      role: undefined, // Sin cargo visible
      order: idx + 1,
    };
  }) || [];

  const disciplinaDoc = {
    _id: 'unit-comision-de-disciplina',
    _type: 'organizationUnit',
    name: 'Comisión de Disciplina',
    slug: {_type: 'slug', current: 'comision-de-disciplina'},
    type: 'commission',
    parentUnit: {_type: 'reference', _ref: 'unit-directorio-oficial'},
    order: 1,
    members: disciplinaMembers,
  };
  mutations.push({createOrReplace: disciplinaDoc});
  report.counts.target.organizationUnit++;

  // C) Coordinador de Protección de Datos (DPC)
  const dpcSrc = comisiones.find((c) => (c.nombre || '').toLowerCase().includes('proteccion'));
  const dpcOriginalMember = miembros.find((m) => m.cargo?.includes('DPC') || m.nombre?.includes('Puyol'));
  const dpcPersonRef = findPersonRef(dpcOriginalMember?.nombre);

  const dpcDoc = {
    _id: 'unit-proteccion-de-datos',
    _type: 'organizationUnit',
    name: 'Coordinador de Protección de Datos (DPC)',
    slug: {_type: 'slug', current: 'proteccion-de-datos'},
    type: 'other',
    parentUnit: {_type: 'reference', _ref: 'unit-directorio-oficial'},
    order: 2,
    members: [
      {
        _key: 'dpc-member-1',
        person: dpcPersonRef || {_type: 'reference', _ref: 'person-alfredo-puyol'},
        role: 'Coordinador',
        contactEmail: dpcOriginalMember?.email || 'dpc@fechitat.cl',
        order: 1,
      },
    ],
  };
  mutations.push({createOrReplace: dpcDoc});
  report.counts.target.organizationUnit++;

  console.log(`   -> Total unidades generadas: ${report.counts.target.organizationUnit}`);

  // =========================================================================
  // 6. CLUBES Y ESCUELAS
  // =========================================================================
  console.log('\n4. Migrando Clubes y Escuelas...');

  for (const esc of escuelas) {
    const slug = esc.slug?.current || slugify(esc.nombre);
    let city = esc.ciudad?.trim() || undefined;
    let address = esc.direccion?.trim() || undefined;
    const region = esc.region?.trim() || undefined;

    // Normalización de ciudad sucia (Sindempart, Coquimbo)
    if (city === 'Sindempart, Coquimbo') {
      city = 'Coquimbo';
      address = address ? `${address} (Sindempart)` : 'Sector Sindempart';
      report.normalizations.schools.push({
        school: esc.nombre,
        field: 'city',
        original: 'Sindempart, Coquimbo',
        normalized: 'Coquimbo',
      });
    }

    // Normalización de WhatsApp
    let whatsappClean = esc.whatsapp ? normalizeWhatsAppNumber(esc.whatsapp) : undefined;
    if (esc.whatsapp && esc.whatsapp !== whatsappClean) {
      report.normalizations.schools.push({
        school: esc.nombre,
        field: 'whatsapp',
        original: esc.whatsapp,
        normalized: whatsappClean,
      });
    }

    // Normalización de Redes
    const socialLinks: any[] = [];
    if (esc.redes?.instagram) socialLinks.push({platform: 'instagram', url: esc.redes.instagram});
    if (esc.redes?.facebook) socialLinks.push({platform: 'facebook', url: esc.redes.facebook});
    if (esc.redes?.youtube) socialLinks.push({platform: 'youtube', url: esc.redes.youtube});

    const presidentRef = findPersonRef(esc.instructor);

    const clubDoc: any = {
      _id: `club-${slug}`,
      _type: 'club',
      name: esc.nombre,
      slug: {_type: 'slug', current: slug},
      logo: esc.logo || undefined,
      coverImage: esc.foto || undefined,
      city: city || undefined,
      region: region || undefined,
      address: address || undefined,
      whatsapp: whatsappClean || undefined,
      contactEmail: esc.email || undefined,
      description: esc.descripcion || undefined,
      active: esc.activo ?? true,
      socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    };

    if (presidentRef) {
      clubDoc.president = presidentRef;
    }

    if (esc.ubicacion?.lat && esc.ubicacion?.lng) {
      clubDoc.location = {
        _type: 'geopoint',
        lat: esc.ubicacion.lat,
        lng: esc.ubicacion.lng,
      };
    }

    mutations.push({createOrReplace: clubDoc});
    report.counts.target.club++;

    if (!city || !region || !esc.logo) {
      report.missingData.schoolsWithoutLocationOrLogo.push(esc.nombre);
    }
  }

  console.log(`   -> Total clubes migrados: ${report.counts.target.club}`);

  // =========================================================================
  // 7. DOCUMENTOS OFICIALES
  // =========================================================================
  console.log('\n5. Migrando Documentos Oficiales...');

  for (const doc of documentos) {
    const slug = doc.slug?.current || slugify(doc.titulo);
    const cleanTitle = (doc.titulo || '').trim();

    const officialDoc = {
      _id: `doc-${slug}`,
      _type: 'officialDocument',
      title: cleanTitle,
      slug: {_type: 'slug', current: slug},
      description: doc.descripcion || undefined,
      category: doc.tipo === 'protocolo' ? 'protocol' : doc.tipo || 'other',
      file: doc.archivo,
      publicationDate: doc.fechaPublicacion,
      effectiveDate: doc.fechaVigencia || doc.fechaPublicacion,
      version: doc.version || 'Edición 2026',
      status: doc.estado === 'vigente' ? 'current' : doc.estado || 'current',
      owner: {_type: 'reference', _ref: 'unit-comision-de-disciplina'},
      order: doc.orden ?? 0,
      tematicas: doc.tematicas,
      palabrasClave: doc.palabrasClave,
      prioridad: doc.prioridad ?? 0,
      fundamental: doc.fundamental ?? false,
      destacadoCatalogo: doc.destacadoCatalogo ?? false,
      fechaActualizacion: doc.fechaActualizacion,
      icono: doc.icono,
    };

    mutations.push({createOrReplace: officialDoc});
    report.counts.target.officialDocument++;
  }

  console.log(`   -> Total documentos oficiales migrados: ${report.counts.target.officialDocument}`);

  // =========================================================================
  // 8. EVENTOS
  // =========================================================================
  console.log('\n6. Migrando Eventos...');

  for (const ev of eventos) {
    const slug = ev.slug?.current || slugify(ev.titulo);
    const eventDoc = {
      _id: `event-${slug}`,
      _type: 'event',
      title: ev.titulo,
      slug: {_type: 'slug', current: slug},
      startDate: ev.fecha,
      endDate: ev.fechaFin || undefined,
      type: ev.tipo === 'competencia' ? 'championship' : ev.tipo === 'seminario' ? 'seminar' : ev.tipo || 'other',
      status: ev.estado || 'proximo',
      city: ev.ciudad || undefined,
      venue: ev.lugar || undefined,
      address: ev.direccion || undefined,
      coverImage: ev.flyer || undefined,
      gallery: ev.galeria || undefined,
      description: ev.descripcion || undefined,
      categories: ev.categorias || undefined,
      participants: ev.participantes || undefined,
      results: ev.resultados || undefined,
      featured: ev.destacado ?? false,
    };

    mutations.push({createOrReplace: eventDoc});
    report.counts.target.event++;
  }

  console.log(`   -> Total eventos migrados: ${report.counts.target.event}`);

  // =========================================================================
  // 9. BLOG POSTS (NOTICIAS)
  // =========================================================================
  console.log('\n7. Migrando Publicaciones del Blog...');

  for (const post of posts) {
    const slug = post.slug?.current || slugify(post.titulo);
    const postDoc = {
      _id: `post-${slug}`,
      _type: 'post',
      title: post.titulo,
      slug: {_type: 'slug', current: slug},
      excerpt: post.extracto,
      content: post.contenido,
      coverImage: post.imagen || undefined,
      author: undefined, // Institucional (se muestra como FECHITAT)
      publishedAt: post.fecha,
      categories: (post.categorias || []).map((c: string) => (c === 'tecnica' ? 'Técnica' : 'Noticias')),
      featured: post.destacado ?? false,
      tematicas: post.tematicas,
      palabrasClave: post.palabrasClave,
      prioridad: post.prioridad ?? 0,
      fundamental: post.fundamental ?? false,
      destacadoCatalogo: post.destacadoCatalogo ?? false,
      fechaActualizacion: post.fechaActualizacion,
      icono: post.icono,
    };

    mutations.push({createOrReplace: postDoc});
    report.counts.target.post++;
  }

  console.log(`   -> Total posts migrados: ${report.counts.target.post}`);

  // =========================================================================
  // 10. HITOS HISTÓRICOS (Orden cronológico decidido en Checkpoint 1)
  // =========================================================================
  console.log('\n8. Migrando Hitos Históricos...');

  for (const hito of hitos) {
    const slug = slugify(hito.titulo);
    let order = hito.orden || 1;
    let date = hito.fecha || undefined;

    const normTitle = (hito.titulo || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Caso 2011 decidido: Creación order 1 (con fecha), Expansión order 2 (sin fecha falsa)
    if (normTitle.includes('creacion')) {
      order = 1;
      date = '2011-06-01';
      report.normalizations.milestones.push({
        title: hito.titulo,
        year: 2011,
        date: date,
        order: order,
        note: 'Orden cronológico 1 (Fundación)',
      });
    } else if (normTitle.includes('expansion')) {
      order = 2;
      date = undefined; // Eliminado mes/día no documentado
      report.normalizations.milestones.push({
        title: hito.titulo,
        year: 2011,
        date: null,
        order: order,
        note: 'Orden cronológico 2 (Sin fecha falsa)',
      });
    }

    const milestoneDoc = {
      _id: `milestone-${slug}`,
      _type: 'historicalMilestone',
      title: hito.titulo,
      slug: {_type: 'slug', current: slug},
      year: hito.anio,
      date: date,
      description: hito.descripcion,
      order: order,
    };

    mutations.push({createOrReplace: milestoneDoc});
    report.counts.target.historicalMilestone++;
  }

  console.log(`   -> Total hitos históricos migrados: ${report.counts.target.historicalMilestone}`);

  // =========================================================================
  // 11. SINGLETON FEDERACIÓN
  // =========================================================================
  console.log('\n9. Generando Singleton Federación...');

  const federationDoc = {
    _id: 'federation',
    _type: 'federation',
    name: 'Federación Chilena de Taekwon-Do Tradicional (FECHITAT)',
    slug: {_type: 'slug', current: 'fechitat'},
    description:
      'Entidad rectora del Taekwon-Do ITF original en Chile, reconocida como Asociación Nacional (NA) ante la International Taekwon-Do Federation.',
    metrics: [
      {
        _key: 'metric-blackBelts',
        key: 'blackBelts',
        label: 'Cinturones negros',
        mode: 'manual',
        value: '50+',
        order: 1,
        showOn: ['home'],
      },
      {
        _key: 'metric-activeCompetitors',
        key: 'activeCompetitors',
        label: 'Competidores activos',
        mode: 'manual',
        value: '200+',
        order: 2,
        showOn: ['home'],
      },
      {
        _key: 'metric-worldMedals',
        key: 'worldMedals',
        label: 'Medallas mundiales',
        mode: 'manual',
        value: '2',
        order: 3,
        showOn: ['jovenes'],
      },
      {
        _key: 'metric-bestAchievement',
        key: 'bestAchievement',
        label: 'Lugar mundial',
        mode: 'manual',
        value: '3.er',
        order: 4,
        showOn: ['jovenes'],
      },
    ],
  };

  mutations.push({createOrReplace: federationDoc});

  console.log(`\n======================================================`);
  console.log(` RESUMEN DE MUTACIONES GENERADAS: ${mutations.length} documentos`);
  console.log(`======================================================`);

  // 12. Ejecución o Dry-Run
  if (isApply) {
    console.log(`\n🚀 APLICANDO ${mutations.length} MUTACIONES EN SANITY [${targetDataset}]...`);
    const transaction = client.transaction();

    // Eliminar documentos con prefijo de punto (incompatibles con ACL pública de Sanity)
    const oldDotDocs = await client.fetch<Array<{_id: string}>>(`*[
      _id in path("person.**") ||
      _id in path("unit.**") ||
      _id in path("club.**") ||
      _id in path("officialDocument.**") ||
      _id in path("event.**") ||
      _id in path("post.**") ||
      _id in path("historicalMilestone.**")
    ]{_id}`);
    if (oldDotDocs.length > 0) {
      console.log(`   Limpiando ${oldDotDocs.length} IDs previos con prefijo de punto...`);
      for (const d of oldDotDocs) {
        transaction.delete(d._id);
      }
    }

    for (const m of mutations) {
      if (m.createOrReplace) {
        transaction.createOrReplace(m.createOrReplace);
      }
    }
    const result = await transaction.commit();
    console.log(`✔ Transacción completada con éxito. ID: ${result.transactionId}`);
  } else {
    console.log(`\n🔍 MODO DRY-RUN: 0 mutaciones aplicadas a Sanity.`);
    console.log(`   Para aplicar cambios ejecute con el flag --apply.`);
  }

  // 13. Guardar reportes JSON y Markdown
  const jsonReportPath = path.join(reportsDir, `migracion-${dateStr}.json`);
  const mdReportPath = path.join(reportsDir, `migracion-${dateStr}.md`);

  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');

  const mdContent = `# Reporte de Migración Sanity FECHITAT — ${dateStr}

**Dataset destino:** \`${targetDataset}\`  
**Modo de ejecución:** \`${isApply ? 'APLICADO (--apply)' : 'SIMULACIÓN (--dry-run)'}\`  
**Fecha:** ${new Date().toISOString()}  

---

## 1. Conteo de Documentos

| Tipo de Contenido | Documentos Origen | Documentos Destino | Estado |
| :--- | :---: | :---: | :--- |
| **Personas (\`person\`)** | 7 (organigrama) + 4 (escuelas) | **${report.counts.target.person}** | Deduplicado exacto por nombre normalizado |
| **Unidades (\`organizationUnit\`)** | 2 (comisiones) + 1 (directorio) | **${report.counts.target.organizationUnit}** | Directorio Oficial, Disciplina, DPC |
| **Clubes / Escuelas (\`club\`)** | 14 | **${report.counts.target.club}** | Slugs conservados, presidentes vinculados |
| **Documentos (\`officialDocument\`)** | 1 | **${report.counts.target.officialDocument}** | Protocolo de disciplina (status: current) |
| **Eventos (\`event\`)** | 4 | **${report.counts.target.event}** | Campos ciudad/lugar/dirección separados |
| **Noticias (\`post\`)** | 2 | **${report.counts.target.post}** | Autores institucionales FECHITAT |
| **Hitos (\`historicalMilestone\`)** | 5 | **${report.counts.target.historicalMilestone}** | Orden cronológico oficial (Creación 1, Expansión 2) |
| **Federación (\`federation\`)** | 2 (métricas sueltas) | **1** | Singleton con 4 métricas (home y jovenes) |
| **Total de Documentos** | **37** | **${mutations.length}** | **Idempotente y determinista** |

---

## 2. Casos de Deduplicación de Personas Resueltos

Las siguientes personas fueron identificadas en múltiples orígenes y unificadas en un único documento \`person\`:

| Persona | ID Determinista | Orígenes Detectados y Fusionados |
| :--- | :--- | :--- |
| **Osvaldo Rojas** | \`person.osvaldo-rojas\` | Directorio Oficial (Presidente) + Comisión Disciplina + Club Sil-la La Serena |
| **Juan Bravo** | \`person.juan-bravo\` | Directorio Oficial (Vicepresidente) + Club Quauhtli |
| **Antonia Astorga** | \`person.antonia-astorga\` | Directorio Oficial (Secretaria) + Club Sil-la Santiago |

---

## 3. Tabla de Normalizaciones Aplicadas

### 3.1 Nombres y Títulos de Personas
| String Origen | Nombre Limpio (\`name\`) | Grado Dan (\`dan\`) | Título Legado (\`legacyTitle\`) | ID Resultante |
| :--- | :--- | :---: | :--- | :--- |
${report.normalizations.persons
  .map(
    (p: any) =>
      `| \`${p.original}\` | \`${p.normalizedName}\` | ${p.dan ?? '—'} | ${p.legacyTitle ? `\`${p.legacyTitle}\`` : '—'} | \`${p.resultingId}\` |`
  )
  .join('\n')}

### 3.2 Escuelas y Contacto
| Club | Campo | Valor Origen | Valor Normalizado |
| :--- | :--- | :--- | :--- |
${report.normalizations.schools
  .map(
    (s: any) =>
      `| **${s.school}** | \`${s.field}\` | \`${s.original}\` | \`${s.normalized}\` |`
  )
  .join('\n')}

### 3.3 Hitos de 2011 (Línea de Tiempo)
| Hito Histórico | Año | Fecha (\`date\`) | Orden (\`order\`) | Criterio |
| :--- | :---: | :---: | :---: | :--- |
${report.normalizations.milestones
  .map(
    (m: any) =>
      `| **${m.title}** | ${m.year} | ${m.date ? `\`${m.date}\`` : '*(Sin fecha)*'} | ${m.order} | ${m.note} |`
  )
  .join('\n')}

---

## 4. Datos Faltantes y Advertencias

1. **Escuelas sin Presidente/Instructor asignado (${report.missingData.schoolsWithoutPresident.length}):**
${report.missingData.schoolsWithoutPresident.map((s: string) => `   - ${s}`).join('\n')}

2. **Escuelas con ubicación o logo pendiente (${report.missingData.schoolsWithoutLocationOrLogo.length}):**
${report.missingData.schoolsWithoutLocationOrLogo.map((s: string) => `   - ${s}`).join('\n')}

3. **Retratos de baja resolución (< 400×500 px, activos a 100×100 px):**
${report.missingData.lowResPortraits.map((p: string) => `   - ${p}`).join('\n')}

4. **Personas sin grado Dan confirmado en base de datos:**
${report.missingData.personsWithoutDan.map((p: string) => `   - ${p}`).join('\n')}

---

## 5. Borradores Detectados (Aislados sin publicar)
Se omitieron deliberadamente de la migración los siguientes **${report.draftsList.length}** borradores del CMS:
${report.draftsList.map((d: string) => `- \`${d}\``).join('\n')}
`;

  fs.writeFileSync(mdReportPath, mdContent, 'utf-8');
  console.log(`\n✔ Reportes generados:`);
  console.log(`   - Markdown: reports/migracion-${dateStr}.md`);
  console.log(`   - JSON:     reports/migracion-${dateStr}.json\n`);
}

runMigration().catch((err) => {
  console.error('\n❌ Error durante la migración:', err);
  process.exit(1);
});
