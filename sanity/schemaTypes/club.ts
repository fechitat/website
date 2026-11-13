import {PinIcon} from '@sanity/icons/Pin'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const CHILE_REGIONS = [
  {title: 'Arica y Parinacota', value: 'Arica y Parinacota'},
  {title: 'Tarapacá', value: 'Tarapacá'},
  {title: 'Antofagasta', value: 'Antofagasta'},
  {title: 'Atacama', value: 'Atacama'},
  {title: 'Coquimbo', value: 'Coquimbo'},
  {title: 'Valparaíso', value: 'Valparaíso'},
  {title: 'Metropolitana', value: 'Metropolitana'},
  {title: "O'Higgins", value: "O'Higgins"},
  {title: 'Maule', value: 'Maule'},
  {title: 'Ñuble', value: 'Ñuble'},
  {title: 'Biobío', value: 'Biobío'},
  {title: 'La Araucanía', value: 'La Araucanía'},
  {title: 'Los Ríos', value: 'Los Ríos'},
  {title: 'Los Lagos', value: 'Los Lagos'},
  {title: 'Aysén', value: 'Aysén'},
  {title: 'Magallanes', value: 'Magallanes'},
] as const

export default defineType({
  name: 'club',
  title: 'Club / Escuela',
  icon: PinIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre de la escuela o club',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL permanente)',
      type: 'slug',
      options: {source: 'name'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Insignia / Escudo oficial del club',
      type: 'image',
    }),
    defineField({
      name: 'coverImage',
      title: 'Foto del Dojang (Cabecera)',
      description: 'Fotografía de las instalaciones y tatami mostrada en la ficha de detalle.',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'region',
      title: 'Región',
      type: 'string',
      options: {
        list: CHILE_REGIONS.map((r) => ({title: r.title, value: r.value})),
      },
      validation: (Rule) => Rule.warning('Se recomienda asignar una región válida para los filtros de búsqueda.'),
    }),
    defineField({
      name: 'city',
      title: 'Ciudad o comuna',
      type: 'string',
      validation: (Rule) => Rule.warning('Se recomienda asignar la ciudad para el posicionamiento SEO local.'),
    }),
    defineField({
      name: 'address',
      title: 'Dirección física del dojang',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Ubicación en el mapa (Geopoint)',
      description: 'Coordenadas exactas para el mapa interactivo de la portada y la ficha de detalle.',
      type: 'geopoint',
    }),
    defineField({
      name: 'president',
      title: 'Presidente (se muestra como «Instructor a cargo»)',
      description: 'Persona a cargo acreditada ante la federación.',
      type: 'reference',
      to: [{type: 'person'}],
      validation: (Rule) =>
        Rule.warning('Hay escuelas sin presidente o instructor a cargo asignado; se recomienda completar cuando se confirme.'),
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp de contacto directo',
      description: 'Dígitos limpios con código de país (ej. 56974203512). Se generará automáticamente el enlace wa.me.',
      type: 'string',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Correo electrónico de contacto',
      type: 'string',
    }),
    defineField({
      name: 'website',
      title: 'Sitio web propio',
      type: 'url',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Redes sociales del club',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Plataforma',
              type: 'string',
              options: {
                list: [
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'X / Twitter', value: 'x'},
                  {title: 'Otra', value: 'other'},
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL del perfil',
              type: 'url',
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Descripción y filosofía del club',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'schedule',
      title: 'Horarios de entrenamiento',
      description: 'Horarios estructurados mostrados en la ficha del club.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'group',
              title: 'Grupo o categoría',
              description: 'Ejemplo: "Infantil", "Juveniles y Adultos", "Cinturones Negros".',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'days',
              title: 'Días de entrenamiento',
              type: 'array',
              of: [{type: 'string'}],
              options: {
                list: [
                  {title: 'Lunes', value: 'lunes'},
                  {title: 'Martes', value: 'martes'},
                  {title: 'Miércoles', value: 'miercoles'},
                  {title: 'Jueves', value: 'jueves'},
                  {title: 'Viernes', value: 'viernes'},
                  {title: 'Sábado', value: 'sabado'},
                  {title: 'Domingo', value: 'domingo'},
                ],
              },
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'startTime',
              title: 'Hora de inicio (HH:MM)',
              description: 'Formato 24 hrs, ej. "18:00".',
              type: 'string',
              validation: (Rule) =>
                Rule.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
                  name: 'hora_24h',
                  invert: false,
                }).warning('Formato recomendado: HH:MM (ej. 18:30).'),
            }),
            defineField({
              name: 'endTime',
              title: 'Hora de término (HH:MM)',
              description: 'Formato 24 hrs, ej. "19:30".',
              type: 'string',
              validation: (Rule) =>
                Rule.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
                  name: 'hora_24h',
                  invert: false,
                }).warning('Formato recomendado: HH:MM (ej. 19:30).'),
            }),
          ],
          preview: {
            select: {
              title: 'group',
              start: 'startTime',
              end: 'endTime',
            },
            prepare({title, start, end}) {
              const time = [start, end].filter(Boolean).join(' - ')
              return {
                title,
                subtitle: time || 'Horario no especificado',
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'active',
      title: 'Club activo en la federación',
      description: 'Solo los clubes activos aparecen en el buscador y mapa público.',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      city: 'city',
      region: 'region',
      media: 'logo',
    },
    prepare({title, city, region, media}) {
      const location = [city, region].filter(Boolean).join(' · ')
      return {
        title,
        subtitle: location || 'Ubicación no especificada',
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Nombre (A-Z)',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
    {
      title: 'Región y Nombre',
      name: 'regionNameAsc',
      by: [{field: 'region', direction: 'asc'}, {field: 'name', direction: 'asc'}],
    },
  ],
})
