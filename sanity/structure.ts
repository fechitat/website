import type {StructureResolver} from 'sanity/structure'
import {HomeIcon} from '@sanity/icons/Home'
import {UsersIcon} from '@sanity/icons/Users'
import {UserIcon} from '@sanity/icons/User'
import {PinIcon} from '@sanity/icons/Pin'
import {DocumentPdfIcon} from '@sanity/icons/DocumentPdf'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {StarIcon} from '@sanity/icons/Star'
import {ClockIcon} from '@sanity/icons/Clock'
import {CommentIcon} from '@sanity/icons/Comment'
import {BookIcon} from '@sanity/icons/Book'
import {ArchiveIcon} from '@sanity/icons/Archive'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenido FECHITAT')
    .items([
      // 1. INSTITUCIÓN
      S.listItem()
        .title('Institución')
        .icon(HomeIcon)
        .child(
          S.list()
            .title('Gestión Institucional')
            .items([
              // Singleton Federación
              S.listItem()
                .title('Federación (Identidad y Métricas)')
                .icon(HomeIcon)
                .child(
                  S.document()
                    .schemaType('federation')
                    .documentId('federation')
                    .title('Federación Chilena de Taekwon-Do Tradicional')
                ),
              // Organigrama: Directorio Oficial
              S.listItem()
                .title('Directorio Oficial')
                .icon(UsersIcon)
                .child(
                  S.documentList()
                    .title('Directorio Oficial (Board)')
                    .filter('_type == "organizationUnit" && type == "board"')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                ),
              // Comisiones y subcomisiones
              S.listItem()
                .title('Comisiones y Grupos de Trabajo')
                .icon(UsersIcon)
                .child(
                  S.documentList()
                    .title('Comisiones, Subcomisiones y Coordinaciones')
                    .filter('_type == "organizationUnit" && type != "board"')
                    .defaultOrdering([{field: 'order', direction: 'asc'}])
                ),
              // Documentos oficiales
              S.documentTypeListItem('officialDocument')
                .title('Documentos Oficiales')
                .icon(DocumentPdfIcon),
            ])
        ),

      // 2. DIRECTORIO
      S.listItem()
        .title('Directorio y Personas')
        .icon(PinIcon)
        .child(
          S.list()
            .title('Directorio de Clubes y Personas')
            .items([
              S.documentTypeListItem('club')
                .title('Clubes y Escuelas')
                .icon(PinIcon),
              S.documentTypeListItem('person')
                .title('Personas e Instructores')
                .icon(UserIcon),
              S.documentTypeListItem('recognition')
                .title('Reconocimientos y Salón de la Fama')
                .icon(StarIcon),
            ])
        ),

      // 3. ACTUALIDAD
      S.listItem()
        .title('Actualidad')
        .icon(CalendarIcon)
        .child(
          S.list()
            .title('Actualidad y Noticias')
            .items([
              S.documentTypeListItem('event')
                .title('Eventos y Campeonatos')
                .icon(CalendarIcon),
              S.documentTypeListItem('post')
                .title('Noticias y Artículos')
                .icon(DocumentTextIcon),
            ])
        ),

      // 4. PATRIMONIO INSTITUCIONAL
      S.listItem()
        .title('Patrimonio Institucional')
        .icon(ClockIcon)
        .child(
          S.list()
            .title('Patrimonio e Historia')
            .items([
              S.documentTypeListItem('historicalMilestone')
                .title('Historia e Hitos')
                .icon(ClockIcon),
              S.documentTypeListItem('testimonio')
                .title('Testimonios')
                .icon(CommentIcon),
            ])
        ),

      S.divider(),

      // 5. FORMACIÓN (Dominio Educativo - Intacto)
      S.listItem()
        .title('Formación y Recursos')
        .icon(BookIcon)
        .child(
          S.list()
            .title('Dominio Educativo y Formación')
            .items([
              S.documentTypeListItem('glosarioTermino')
                .title('Términos del Glosario Técnico')
                .icon(BookIcon),
              S.documentTypeListItem('programaExamen')
                .title('Programa de Examen')
                .icon(BookIcon),
              S.documentTypeListItem('materialEstudio')
                .title('Material de Estudio')
                .icon(BookIcon),
              S.documentTypeListItem('recurso')
                .title('Fichas del Catálogo de Recursos')
                .icon(BookIcon),
            ])
        ),

      S.divider(),

      // 6. ARCHIVO LEGADO (Coexistencia durante migración)
      S.listItem()
        .title('Archivo Legado (Migración)')
        .icon(ArchiveIcon)
        .child(
          S.list()
            .title('Esquemas Legados Pre-Migración')
            .items([
              S.documentTypeListItem('miembroOrganigrama').title('Miembros Organigrama (antiguo)'),
              S.documentTypeListItem('comision').title('Comisiones (antiguo)'),
              S.documentTypeListItem('escuela').title('Escuelas (antiguo)'),
              S.documentTypeListItem('documentoOficial').title('Documentos Oficiales (antiguo)'),
              S.documentTypeListItem('evento').title('Eventos (antiguo)'),
              S.documentTypeListItem('blogPost').title('Blog Posts (antiguo)'),
              S.documentTypeListItem('hitoHistorico').title('Hitos Históricos (antiguo)'),
              S.documentTypeListItem('metrica').title('Métricas (antiguo)'),
              S.documentTypeListItem('campeon').title('Campeones (antiguo)'),
              S.documentTypeListItem('competidor').title('Competidores (antiguo)'),
              S.documentTypeListItem('camiseta').title('Camisetas (antiguo)'),
            ])
        ),
    ])
