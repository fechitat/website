import {CalendarIcon} from '@sanity/icons/Calendar'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'event',
  title: 'Evento',
  icon: CalendarIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del evento',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Fecha y hora de inicio',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Fecha y hora de término (si es multi-día)',
      type: 'datetime',
    }),
    defineField({
      name: 'type',
      title: 'Tipo de evento',
      type: 'string',
      options: {
        list: [
          {title: 'Campeonato / Competencia (Championship)', value: 'championship'},
          {title: 'Seminario / Curso técnico (Seminar)', value: 'seminar'},
          {title: 'Examen de grado (Exam)', value: 'exam'},
          {title: 'Otro (Other)', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'championship',
    }),
    defineField({
      name: 'status',
      title: 'Estado del evento',
      description: 'Permite forzar el estado. Por defecto el sitio evalúa la fecha actual en zona horaria America/Santiago.',
      type: 'string',
      options: {
        list: [
          {title: 'Próximo', value: 'proximo'},
          {title: 'En curso', value: 'en_curso'},
          {title: 'Finalizado', value: 'finalizado'},
          {title: 'Cancelado', value: 'cancelado'},
        ],
      },
      initialValue: 'proximo',
    }),
    defineField({
      name: 'city',
      title: 'Ciudad',
      type: 'string',
      description: 'Ejemplo: "Santiago", "Turkistan", "Venecia".',
    }),
    defineField({
      name: 'venue',
      title: 'Lugar / Recinto',
      type: 'string',
      description: 'Ejemplo: "Polideportivo Cerro Navia", "Jesolo, Italia".',
    }),
    defineField({
      name: 'address',
      title: 'Dirección exacta',
      type: 'string',
      description: 'Ejemplo: "Costanera Sur 5500, Cerro Navia".',
    }),
    defineField({
      name: 'coverImage',
      title: 'Afiche / Imagen principal',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'gallery',
      title: 'Galería de fotos del evento',
      type: 'array',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
    }),
    defineField({
      name: 'description',
      title: 'Descripción e información general',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'categories',
      title: 'Categorías en competencia',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Formas (Tul)', value: 'formas'},
          {title: 'Combate', value: 'combate'},
          {title: 'Rotura de habilidad', value: 'rotura_habilidad'},
          {title: 'Rotura de potencia', value: 'rotura_potencia'},
          {title: 'Defensa personal', value: 'defensa_personal'},
          {title: 'Infantil', value: 'infantil'},
          {title: 'Cadete', value: 'cadete'},
          {title: 'Juvenil', value: 'juvenil'},
          {title: 'Adulto', value: 'adulto'},
          {title: 'Senior', value: 'senior'},
        ],
      },
    }),
    defineField({
      name: 'participants',
      title: 'Número de participantes',
      type: 'number',
    }),
    defineField({
      name: 'results',
      title: 'Resultados oficiales',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'categoria', title: 'Categoría', type: 'string'}),
            defineField({name: 'primerLugar', title: '1er Lugar', type: 'string'}),
            defineField({name: 'segundoLugar', title: '2do Lugar', type: 'string'}),
            defineField({name: 'tercerLugar', title: '3er Lugar', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Destacar en portada ("Próximo evento")',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      type: 'type',
      media: 'coverImage',
    },
    prepare({title, startDate, type, media}) {
      const typeLabels: Record<string, string> = {
        championship: 'Campeonato',
        seminar: 'Seminario',
        exam: 'Examen',
        other: 'Evento',
      }
      const dateStr = startDate ? new Date(startDate).toLocaleDateString('es-CL') : 'Sin fecha'
      return {
        title,
        subtitle: `${typeLabels[type] || type || 'Evento'} · ${dateStr}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Fecha más próxima',
      name: 'startDateAsc',
      by: [{field: 'startDate', direction: 'asc'}],
    },
    {
      title: 'Fecha más reciente',
      name: 'startDateDesc',
      by: [{field: 'startDate', direction: 'desc'}],
    },
  ],
})
